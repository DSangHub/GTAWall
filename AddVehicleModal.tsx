import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface AddVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export default function AddVehicleModal({
  isOpen,
  onClose,
  isAuthenticated,
}: AddVehicleModalProps) {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [days, setDays] = useState("");
  const [mileage, setMileage] = useState("");
  const [condition, setCondition] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, setLocation] = useLocation();

  const utils = trpc.useUtils();
  const createMutation = trpc.vehicles.create.useMutation();
  const uploadImageMutation = trpc.vehicles.uploadImage.useMutation();

  // Check if dealer has a profile
  const { data: dealerProfile, isLoading: profileLoading } = trpc.dealer.profile.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Invalid file type. Please upload a JPG, PNG, or WebP image.");
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File too large. Maximum size is 5MB.");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setTitle("");
    setPrice("");
    setDays("");
    setMileage("");
    setCondition("");
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !price || !days) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Create the vehicle listing
      const { id } = await createMutation.mutateAsync({
        title,
        price: parseInt(price),
        daysUntilAuction: parseInt(days),
        mileage: mileage || undefined,
        condition: condition || undefined,
      });

      // Step 2: Upload image if provided (awaited before success)
      if (imageFile && id) {
        try {
          const base64 = await readFileAsBase64(imageFile);
          await uploadImageMutation.mutateAsync({
            vehicleId: id,
            imageBase64: base64,
            mimeType: imageFile.type,
          });
        } catch {
          // Vehicle was created but image failed — notify user
          toast.warning("Vehicle posted, but image upload failed. You can try uploading again from your dashboard.");
        }
      }

      // Invalidate queries to refresh the wall
      utils.vehicles.list.invalidate();
      utils.vehicles.myListings.invalidate();

      toast.success("Vehicle added to GTA Wall!", {
        description: "Your listing is now live with a countdown timer.",
      });

      resetForm();
      onClose();
    } catch {
      toast.error("Failed to create listing. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // If not authenticated, show login prompt
  if (!isAuthenticated) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-[#141414] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-white">
              Sign In to Post
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Sign in to post vehicles on the GTA Wall.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 space-y-4">
            <a
              href={getLoginUrl()}
              className="block w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl text-center transition-all duration-150 active:scale-[0.97]"
            >
              Sign In / Create Account
            </a>
            <p className="text-xs text-zinc-500 text-center">
              Free to list. No credit card required.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // If authenticated but no dealer profile, redirect to signup
  if (!profileLoading && !dealerProfile) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-[#141414] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-white">
              Complete Dealer Registration
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              You need to complete your dealer profile before posting vehicles.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 space-y-4">
            <Button
              onClick={() => { onClose(); setLocation("/dealer-signup"); }}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-all duration-150 active:scale-[0.97] h-auto"
            >
              Register as Dealer
            </Button>
            <p className="text-xs text-zinc-500 text-center">
              Takes 30 seconds. Post up to 3 vehicles for free.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#141414] border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-white">
            Add Vehicle to GTA Wall
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Post a vehicle before it goes to auction. Buyers can make offers
            directly.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="vehicle-title" className="text-zinc-300 text-sm">
              Vehicle Title *
            </Label>
            <Input
              id="vehicle-title"
              placeholder="e.g. 2022 Ford F-150 XLT"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1.5 bg-[#1a1a1a] border-white/10 text-white placeholder:text-zinc-600 focus:border-red-500 focus:ring-red-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vehicle-price" className="text-zinc-300 text-sm">
                Price ($) *
              </Label>
              <Input
                id="vehicle-price"
                type="number"
                placeholder="28900"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="mt-1.5 bg-[#1a1a1a] border-white/10 text-white placeholder:text-zinc-600 focus:border-red-500 focus:ring-red-500/20"
              />
            </div>
            <div>
              <Label htmlFor="vehicle-days" className="text-zinc-300 text-sm">
                Days Until Auction *
              </Label>
              <Input
                id="vehicle-days"
                type="number"
                placeholder="5"
                min="1"
                max="90"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                className="mt-1.5 bg-[#1a1a1a] border-white/10 text-white placeholder:text-zinc-600 focus:border-red-500 focus:ring-red-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vehicle-mileage" className="text-zinc-300 text-sm">
                Mileage
              </Label>
              <Input
                id="vehicle-mileage"
                placeholder="e.g. 32,400 mi"
                value={mileage}
                onChange={(e) => setMileage(e.target.value)}
                className="mt-1.5 bg-[#1a1a1a] border-white/10 text-white placeholder:text-zinc-600 focus:border-red-500 focus:ring-red-500/20"
              />
            </div>
            <div>
              <Label htmlFor="vehicle-condition" className="text-zinc-300 text-sm">
                Condition
              </Label>
              <Input
                id="vehicle-condition"
                placeholder="e.g. Excellent"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="mt-1.5 bg-[#1a1a1a] border-white/10 text-white placeholder:text-zinc-600 focus:border-red-500 focus:ring-red-500/20"
              />
            </div>
          </div>

          {/* Image upload */}
          <div>
            <Label className="text-zinc-300 text-sm">Vehicle Photo</Label>
            <div
              className="mt-1.5 border-2 border-dashed border-white/10 rounded-lg p-4 text-center cursor-pointer hover:border-red-500/30 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded-lg"
                />
              ) : (
                <div className="py-4">
                  <p className="text-zinc-500 text-sm">
                    Click to upload a photo
                  </p>
                  <p className="text-zinc-600 text-xs mt-1">
                    JPG, PNG, WebP — max 5MB
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-all duration-150 active:scale-[0.97] h-auto mt-6 disabled:opacity-50"
          >
            {isSubmitting ? "Posting..." : "Post to Wall"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
