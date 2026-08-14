import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  getActiveVehicles,
  getExpiredVehicles,
  getVehicleById,
  getDealerVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getDealerProfile,
  getDealerProfileByUserId,
  createDealerProfile,
  getActiveVehicleCount,
  updateDealerSubscription,
  getAllDealers,
  getAllVehicles,
  getPlatformStats,
  adminToggleVehicle,
  adminUpdateDealerLimit,
  updateDealerLogo,
  createBuyerAlert,
  deactivateBuyerAlert,
  getMatchingAlerts,
  updateDealerLocation,
} from "./db";
import { notifyOwner } from "./_core/notification";
import { storagePut } from "./storage";
import { createCheckoutSession } from "./stripe/index";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  dealer: router({
    /** Protected: get current dealer's profile */
    profile: protectedProcedure.query(async ({ ctx }) => {
      return getDealerProfile(ctx.user.id);
    }),

    /** Protected: register as a dealer (signup form) */
    register: protectedProcedure
      .input(
        z.object({
          dealerName: z.string().min(1).max(255),
          address: z.string().min(1).max(500),
          phone: z.string().min(7).max(32),
          latitude: z.number().min(-90).max(90).optional(),
          longitude: z.number().min(-180).max(180).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const existing = await getDealerProfile(ctx.user.id);
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "You are already registered as a dealer.",
          });
        }

        const id = await createDealerProfile({
          userId: ctx.user.id,
          dealerName: input.dealerName,
          address: input.address,
          phone: input.phone,
          latitude: input.latitude?.toFixed(7) ?? null,
          longitude: input.longitude?.toFixed(7) ?? null,
        });

        return { id };
      }),

    /** Protected: update dealer location (geocode from address) */
    updateLocation: protectedProcedure
      .input(
        z.object({
          latitude: z.number().min(-90).max(90),
          longitude: z.number().min(-180).max(180),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const profile = await getDealerProfile(ctx.user.id);
        if (!profile) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Dealer profile not found" });
        }
        await updateDealerLocation(
          ctx.user.id,
          input.latitude.toFixed(7),
          input.longitude.toFixed(7)
        );
        return { success: true };
      }),

    /** Protected: create Stripe checkout session for website URL subscription */
    activateSubscription: protectedProcedure
      .input(
        z.object({
          websiteUrl: z.string().url().max(512),
          plan: z.enum(["monthly", "yearly"]),
          origin: z.string().url(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const profile = await getDealerProfile(ctx.user.id);
        if (!profile) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Please complete dealer registration first.",
          });
        }

        const session = await createCheckoutSession({
          userId: ctx.user.id,
          userEmail: ctx.user.email || "",
          userName: ctx.user.name,
          dealerProfileId: profile.id,
          stripeCustomerId: profile.stripeCustomerId,
          websiteUrl: input.websiteUrl,
          plan: input.plan,
          origin: input.origin,
        });

        return {
          checkoutUrl: session.url,
          plan: input.plan,
          price: input.plan === "monthly" ? 50 : 500,
        };
      }),

    /** Protected: upload dealer logo/avatar */
    uploadLogo: protectedProcedure
      .input(
        z.object({
          imageBase64: z.string(),
          mimeType: z.string().default("image/jpeg"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const profile = await getDealerProfile(ctx.user.id);
        if (!profile) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Please complete dealer registration first.",
          });
        }

        const buffer = Buffer.from(input.imageBase64, "base64");
        const ext = input.mimeType.split("/")[1] || "jpg";
        const fileKey = `dealers/${ctx.user.id}/logo.${ext}`;

        const { url } = await storagePut(fileKey, buffer, input.mimeType);
        await updateDealerLogo(ctx.user.id, url);

        return { logoUrl: url };
      }),

    /** Protected: update website URL (for active subscribers) */
    updateWebsiteUrl: protectedProcedure
      .input(z.object({ websiteUrl: z.string().url().max(512) }))
      .mutation(async ({ ctx, input }) => {
        const profile = await getDealerProfile(ctx.user.id);
        if (!profile || !profile.subscriptionEndDate || profile.subscriptionEndDate < new Date()) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Active subscription required to update website URL.",
          });
        }

        await updateDealerSubscription(ctx.user.id, {
          websiteUrl: input.websiteUrl,
        });

        return { success: true };
      }),
  }),

  vehicles: router({
    /** Public: get all active vehicles for the wall */
    list: publicProcedure.query(async () => {
      return getActiveVehicles();
    }),

    /** Public: get recently expired vehicles (gone to auction) */
    expired: publicProcedure.query(async () => {
      return getExpiredVehicles();
    }),

    /** Public: get a single vehicle with dealer info */
    detail: publicProcedure
      .input(z.object({ id: z.number().int() }))
      .query(async ({ input }) => {
        const vehicle = await getVehicleById(input.id);
        if (!vehicle) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Vehicle not found." });
        }

        // Get dealer profile for this vehicle
        const dealerProfile = await getDealerProfileByUserId(vehicle.dealerId);

        // Only include website URL if subscription is active
        let dealerWebsiteUrl: string | null = null;
        if (
          dealerProfile?.websiteUrl &&
          dealerProfile.subscriptionEndDate &&
          dealerProfile.subscriptionEndDate > new Date()
        ) {
          dealerWebsiteUrl = dealerProfile.websiteUrl;
        }

        return {
          ...vehicle,
          dealer: dealerProfile
            ? {
                name: dealerProfile.dealerName,
                phone: dealerProfile.phone,
                websiteUrl: dealerWebsiteUrl,
                logoUrl: dealerProfile.logoUrl || null,
              }
            : null,
        };
      }),

    /** Protected: get current dealer's vehicles */
    myListings: protectedProcedure.query(async ({ ctx }) => {
      return getDealerVehicles(ctx.user.id);
    }),

    /** Protected: create a new vehicle listing (max 3 active) */
    create: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1).max(255),
          price: z.number().int().positive(),
          daysUntilAuction: z.number().int().min(1).max(90),
          mileage: z.string().optional(),
          condition: z.string().optional(),
          description: z.string().max(2000).optional(),
          vin: z.string().max(20).optional(),
          year: z.number().int().min(1900).max(2030).optional(),
          make: z.string().max(64).optional(),
          model: z.string().max(64).optional(),
          color: z.string().max(64).optional(),
          isPremium: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Enforce dealer profile requirement
        const profile = await getDealerProfile(ctx.user.id);
        if (!profile) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Please complete your dealer registration before posting vehicles.",
          });
        }

        // Enforce vehicle limit (default 3)
        const activeCount = await getActiveVehicleCount(ctx.user.id);
        if (activeCount >= profile.maxVehicles) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `You have reached your limit of ${profile.maxVehicles} active vehicles. Remove an existing listing to post a new one.`,
          });
        }

        const auctionDeadline = Date.now() + input.daysUntilAuction * 86400000;
        const id = await createVehicle({
          dealerId: ctx.user.id,
          title: input.title,
          price: input.price,
          auctionDeadline,
          mileage: input.mileage ?? null,
          condition: input.condition ?? null,
          description: input.description ?? null,
          vin: input.vin ?? null,
          year: input.year ?? null,
          make: input.make ?? null,
          model: input.model ?? null,
          color: input.color ?? null,
          isPremium: input.isPremium ?? false,
        });

        // Notify owner about matching buyer alerts (fire-and-forget)
        getMatchingAlerts({
          make: input.make ?? null,
          model: input.model ?? null,
          price: input.price,
          year: input.year ?? null,
        }).then((alerts) => {
          if (alerts.length > 0) {
            const emails = alerts.map((a) => a.email).join(", ");
            notifyOwner({
              title: `${alerts.length} buyer alert(s) matched: ${input.title}`,
              content: `New vehicle "${input.title}" ($${input.price.toLocaleString()}) matches ${alerts.length} buyer alert subscription(s).\n\nMatching emails: ${emails}`,
            }).catch(() => {});
          }
        }).catch(() => {});

        return { id };
      }),

    /** Protected: upload an image for a vehicle */
    uploadImage: protectedProcedure
      .input(
        z.object({
          vehicleId: z.number().int(),
          imageBase64: z.string(),
          mimeType: z.string().default("image/jpeg"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const buffer = Buffer.from(input.imageBase64, "base64");
        const ext = input.mimeType.split("/")[1] || "jpg";
        const fileKey = `vehicles/${ctx.user.id}/${input.vehicleId}.${ext}`;

        const { url } = await storagePut(fileKey, buffer, input.mimeType);

        await updateVehicle(input.vehicleId, ctx.user.id, { imageUrl: url });

        return { url };
      }),

    /** Protected: update a vehicle listing */
    update: protectedProcedure
      .input(
        z.object({
          id: z.number().int(),
          title: z.string().min(1).max(255).optional(),
          price: z.number().int().positive().optional(),
          mileage: z.string().optional(),
          condition: z.string().optional(),
          description: z.string().max(2000).optional(),
          vin: z.string().max(20).optional(),
          year: z.number().int().min(1900).max(2030).optional(),
          make: z.string().max(64).optional(),
          model: z.string().max(64).optional(),
          color: z.string().max(64).optional(),
          isPremium: z.boolean().optional(),
          isActive: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await updateVehicle(id, ctx.user.id, data);
        return { success: true };
      }),

    /** Protected: soft-delete a vehicle listing */
    delete: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        await deleteVehicle(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  admin: router({
    /** Admin: get platform stats */
    stats: adminProcedure.query(async () => {
      return getPlatformStats();
    }),

    /** Admin: get all dealers */
    dealers: adminProcedure.query(async () => {
      return getAllDealers();
    }),

    /** Admin: get all vehicles */
    vehicles: adminProcedure.query(async () => {
      return getAllVehicles();
    }),

    /** Admin: toggle vehicle active status */
    toggleVehicle: adminProcedure
      .input(z.object({ vehicleId: z.number().int(), isActive: z.boolean() }))
      .mutation(async ({ input }) => {
        await adminToggleVehicle(input.vehicleId, input.isActive);
        return { success: true };
      }),

    /** Admin: update dealer vehicle limit */
    updateDealerLimit: adminProcedure
      .input(z.object({ dealerProfileId: z.number().int(), maxVehicles: z.number().int().min(1).max(50) }))
      .mutation(async ({ input }) => {
        await adminUpdateDealerLimit(input.dealerProfileId, input.maxVehicles);
        return { success: true };
      }),
  }),

  alerts: router({
    /** Public: subscribe to vehicle alerts */
    subscribe: publicProcedure
      .input(
        z.object({
          email: z.string().email().max(320),
          make: z.string().max(64).optional(),
          model: z.string().max(64).optional(),
          maxPrice: z.number().int().positive().optional(),
          minYear: z.number().int().min(1900).max(2030).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const id = await createBuyerAlert({
          email: input.email,
          userId: ctx.user?.id ?? null,
          make: input.make || null,
          model: input.model || null,
          maxPrice: input.maxPrice || null,
          minYear: input.minYear || null,
        });
        return { id, success: true };
      }),

    /** Public: unsubscribe from alerts */
    unsubscribe: publicProcedure
      .input(
        z.object({
          alertId: z.number().int(),
          email: z.string().email(),
        })
      )
      .mutation(async ({ input }) => {
        await deactivateBuyerAlert(input.alertId, input.email);
        return { success: true };
      }),
  }),

  contact: router({
    submit: publicProcedure
      .input(
        z.object({
          name: z.string().min(1).max(100),
          email: z.string().email().max(200),
          subject: z.string().max(50).default("general"),
          message: z.string().min(1).max(2000),
        })
      )
      .mutation(async ({ input }) => {
        const sent = await notifyOwner({
          title: `New Contact: ${input.subject}`,
          content: `From: ${input.name} (${input.email})\nSubject: ${input.subject}\n\n${input.message}`,
        });
        if (!sent) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to send message. Please try again later.",
          });
        }
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
