import { useEffect } from "react";
import { useSearchParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { TbKey, TbUser } from "react-icons/tb";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/common/page-header";
import { FormSection, SubmitButton } from "@/components/forms/form-section";
import { ImageField, TextField } from "@/components/forms/fields";
import { meKey, useMe } from "@/hooks/use-auth";
import { apiPut } from "@/lib/api";
import { authStore } from "@/lib/auth-store";
import { applyApiErrors } from "@/lib/errors";
import { initials } from "@/lib/utils";
import type { AuthUser } from "@/types";

const profileSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  avatar_url: z.string().nullable(),
});
type ProfileValues = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    current_password: z.string().min(1, "Enter your current password"),
    password: z.string().min(8, "At least 8 characters"),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords don't match" });
type PasswordValues = z.infer<typeof passwordSchema>;

export function ProfilePage() {
  const me = useMe();
  const qc = useQueryClient();
  const [sp, setSp] = useSearchParams();
  const tab = sp.get("tab") === "password" ? "password" : "profile";
  const user = me.data?.user;

  const profile = useForm<ProfileValues>({ resolver: zodResolver(profileSchema), defaultValues: { name: "", avatar_url: null } });
  const password = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { current_password: "", password: "", confirm: "" },
  });

  useEffect(() => {
    if (user) profile.reset({ name: user.name, avatar_url: user.avatar_url ?? null });
  }, [user, profile]);

  const saveProfile = async (v: ProfileValues) => {
    try {
      const updated = await apiPut<AuthUser>("tenant", "/auth/profile", v);
      if (updated?.id) authStore.update("tenant", { user: updated });
      await qc.invalidateQueries({ queryKey: meKey("tenant") });
      toast.success("Profile updated");
    } catch (e) {
      applyApiErrors(e, profile.setError);
    }
  };

  const savePassword = async (v: PasswordValues) => {
    try {
      await apiPut("tenant", "/auth/password", { current_password: v.current_password, password: v.password });
      password.reset();
      toast.success("Password changed");
    } catch (e) {
      applyApiErrors(e, password.setError);
    }
  };

  return (
    <>
      <PageHeader title="Your profile" description="Manage your personal details and sign-in security." breadcrumbs={[{ label: "Account" }, { label: "Profile" }]} />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="h-fit">
          <CardContent className="flex flex-col items-center gap-3 text-center">
            <Avatar className="size-20">
              {user?.avatar_url && <AvatarImage src={user.avatar_url} alt="" />}
              <AvatarFallback className="text-xl">{initials(user?.name)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold">{user?.name}</div>
              <div className="text-muted-foreground text-sm">{user?.email}</div>
            </div>
            <div className="flex flex-wrap justify-center gap-1.5">
              {user?.role?.name && <Badge variant="secondary">{user.role.name}</Badge>}
              {me.data?.tenant && <Badge variant="outline">{me.data.tenant.name}</Badge>}
            </div>
            {me.data?.permissions.includes("*") && <p className="text-muted-foreground text-xs">You have full access to this store.</p>}
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Tabs
            value={tab}
            onValueChange={(t) => setSp(t === "password" ? { tab: "password" } : {}, { replace: true })}
            className="gap-4"
          >
            <TabsList>
              <TabsTrigger value="profile">
                <TbUser /> Profile
              </TabsTrigger>
              <TabsTrigger value="password">
                <TbKey /> Password
              </TabsTrigger>
            </TabsList>
            <TabsContent value="profile">
              <Form {...profile}>
                <form onSubmit={profile.handleSubmit(saveProfile)}>
                  <FormSection title="Personal information">
                    <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
                      <ImageField control={profile.control} name="avatar_url" label="Avatar" aspect="aspect-square" />
                      <div className="space-y-4">
                        <TextField control={profile.control} name="name" label="Full name" />
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Email</p>
                          <p className="text-muted-foreground bg-muted/50 rounded-md border px-3 py-2 text-sm">{user?.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <SubmitButton loading={profile.formState.isSubmitting}>Save profile</SubmitButton>
                    </div>
                  </FormSection>
                </form>
              </Form>
            </TabsContent>
            <TabsContent value="password">
              <Form {...password}>
                <form onSubmit={password.handleSubmit(savePassword)}>
                  <FormSection title="Change password" description="Use at least 8 characters. You'll stay signed in on this device.">
                    <TextField control={password.control} name="current_password" label="Current password" type="password" autoComplete="current-password" />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <TextField control={password.control} name="password" label="New password" type="password" autoComplete="new-password" />
                      <TextField control={password.control} name="confirm" label="Confirm new password" type="password" autoComplete="new-password" />
                    </div>
                    <div className="flex justify-end">
                      <SubmitButton loading={password.formState.isSubmitting}>Update password</SubmitButton>
                    </div>
                  </FormSection>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
          {user?.status && <p className="text-muted-foreground mt-3 text-xs">Account status: {user.status}</p>}
        </div>
      </div>
    </>
  );
}
