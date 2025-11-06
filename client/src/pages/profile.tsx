import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Edit, Save, X, Mail, User, Shield, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { updateProfile } from "firebase/auth";
import { format } from "date-fns";

const formSchema = z.object({
  displayName: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
});

type FormValues = z.infer<typeof formSchema>;

export default function Profile() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: "",
      email: "",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        displayName: user.displayName || "",
        email: user.email || "",
      });
    }
  }, [user, form]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (user) {
      form.reset({
        displayName: user.displayName || "",
        email: user.email || "",
      });
    }
    setIsEditing(false);
  };

  const handleSubmit = async (values: FormValues) => {
    if (!user) return;

    setIsSaving(true);
    try {
      await updateProfile(user, {
        displayName: values.displayName,
      });

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });

      setIsEditing(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
            <div className="h-4 w-64 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="h-6 w-32 bg-muted animate-pulse rounded" />
            <div className="h-10 w-full bg-muted animate-pulse rounded" />
            <div className="h-32 bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Please log in to view your profile</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-muted-foreground">View and manage your account information</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="max-w-2xl"
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Profile Information</CardTitle>
              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEdit}
                  data-testid="button-edit-profile"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                {/* Avatar and Name */}
                <div className="flex items-center gap-4 pb-4 border-b">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-xl">
                      {getInitials(user.displayName || user.email || "User")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <FormField
                      control={form.control}
                      name="displayName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Display Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              disabled={!isEditing}
                              className="text-lg font-semibold"
                              placeholder="Your name"
                              data-testid="input-display-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          disabled={true}
                          className="bg-muted"
                          data-testid="input-email"
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground">
                        Email cannot be changed. Contact support if you need to update your email.
                      </p>
                    </FormItem>
                  )}
                />

                {/* User ID */}
                <div className="pt-4 border-t">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      User ID
                    </div>
                    <div className="text-sm font-mono text-muted-foreground bg-muted p-2 rounded">
                      {user.uid}
                    </div>
                  </div>
                </div>

                {/* Account Created Date */}
                {user.metadata.creationTime && (
                  <div className="pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Account created on {format(new Date(user.metadata.creationTime), "MMM dd, yyyy 'at' h:mm a")}
                      </span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {isEditing && (
                  <div className="flex gap-2 pt-4">
                    <Button
                      type="submit"
                      disabled={isSaving}
                      data-testid="button-save-profile"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                      disabled={isSaving}
                      data-testid="button-cancel-edit"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

