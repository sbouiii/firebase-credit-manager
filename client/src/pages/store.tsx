import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Save, Upload, Store, Image as ImageIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { useStore, useCreateStore, useUpdateStore } from "@/hooks/useFirestore";
import { Store as StoreType } from "@shared/schema";

const formSchema = z.object({
  name: z.string().min(1, "Store name is required").max(100, "Store name is too long"),
  logo: z.string().url("Invalid URL").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

export default function StorePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: store, isLoading: loading } = useStore();
  const createStore = useCreateStore();
  const updateStore = useUpdateStore();

  const [logoPreview, setLogoPreview] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      logo: "",
    },
  });

  useEffect(() => {
    if (store) {
      form.reset({
        name: store.name,
        logo: store.logo || "",
      });
      setLogoPreview(store.logo || "");
    }
  }, [store, form]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    form.setValue("logo", url);
    setLogoPreview(url);
  };

  const handleSubmit = async (values: FormValues) => {
    if (!user) return;

    setIsSaving(true);
    try {
      if (store) {
        // Update existing store
        await updateStore.mutateAsync({
          id: store.id,
          data: {
            name: values.name,
            logo: values.logo || undefined,
          },
        });
        toast({
          title: "Store updated",
          description: "Your store information has been updated successfully.",
        });
      } else {
        // Create new store
        await createStore.mutateAsync({
          name: values.name,
          logo: values.logo || undefined,
          userId: user.uid,
        });
        toast({
          title: "Store created",
          description: "Your store has been created successfully.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save store information",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
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

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-3xl font-bold">Store Settings</h1>
        <p className="text-muted-foreground">Personalize your store name and logo</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="max-w-2xl"
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              <CardTitle>Store Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                {/* Store Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Store Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter your store name"
                          className="text-lg"
                          data-testid="input-store-name"
                        />
                      </FormControl>
                      <FormDescription>
                        This name will be displayed in your dashboard
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Store Logo */}
                <FormField
                  control={form.control}
                  name="logo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Store Logo URL</FormLabel>
                      <FormControl>
                        <div className="space-y-4">
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <Input
                                {...field}
                                type="url"
                                placeholder="https://example.com/logo.png"
                                onChange={(e) => {
                                  field.onChange(e);
                                  handleLogoChange(e);
                                }}
                                data-testid="input-store-logo"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                const url = prompt("Enter logo URL:");
                                if (url) {
                                  form.setValue("logo", url);
                                  setLogoPreview(url);
                                }
                              }}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Upload
                            </Button>
                          </div>
                          {logoPreview && (
                            <div className="border rounded-lg p-4 bg-muted/50">
                              <div className="flex items-center gap-2 mb-2">
                                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">Preview</span>
                              </div>
                              <div className="flex items-center justify-center p-4 bg-background rounded border">
                                <img
                                  src={logoPreview}
                                  alt="Store logo preview"
                                  className="max-h-32 max-w-full object-contain"
                                  onError={() => {
                                    toast({
                                      title: "Invalid image URL",
                                      description: "The provided URL does not point to a valid image",
                                      variant: "destructive",
                                    });
                                    setLogoPreview("");
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormDescription>
                        Enter a URL to an image file (PNG, JPG, SVG, etc.)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Store Preview */}
                {form.watch("name") && (
                  <div className="pt-4 border-t">
                    <div className="space-y-2">
                      <span className="text-sm font-medium">Preview</span>
                      <Card className="p-4 bg-muted/50">
                        <div className="flex items-center gap-4">
                          {logoPreview && (
                            <img
                              src={logoPreview}
                              alt="Store logo"
                              className="h-12 w-12 object-contain rounded"
                              onError={() => setLogoPreview("")}
                            />
                          )}
                          <div>
                            <div className="font-semibold text-lg">
                              {form.watch("name") || "Your Store Name"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              This is how your store will appear in the dashboard
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    disabled={isSaving || createStore.isPending || updateStore.isPending}
                    data-testid="button-save-store"
                    className="w-full"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving || createStore.isPending || updateStore.isPending
                      ? "Saving..."
                      : store
                        ? "Update Store"
                        : "Create Store"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

