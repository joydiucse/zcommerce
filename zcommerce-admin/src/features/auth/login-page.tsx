import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useSearchParams } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { TbBuildingStore, TbEye, TbEyeOff, TbLoader2, TbShieldCog } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/layout/app-shell";
import { login } from "@/lib/api";
import { authStore } from "@/lib/auth-store";
import { IS_DEV } from "@/lib/env";
import { applyApiErrors } from "@/lib/errors";
import type { Scope } from "@/types";

const merchantSchema = z.object({
  tenant: z.string().trim().min(1, "Store slug is required"),
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
type MerchantValues = z.infer<typeof merchantSchema>;

const platformSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
type PlatformValues = z.infer<typeof platformSchema>;

function PasswordInput(props: React.ComponentProps<typeof Input>) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={show ? "text" : "password"} className="pr-10" />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-3 flex items-center"
        aria-label={show ? "Hide password" : "Show password"}
        tabIndex={-1}
      >
        {show ? <TbEyeOff className="size-4" /> : <TbEye className="size-4" />}
      </button>
    </div>
  );
}

function useFinishLogin() {
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const qc = useQueryClient();
  return (scope: Scope) => {
    qc.removeQueries({ queryKey: [scope] });
    const next = sp.get("next");
    const fallback = scope === "system" ? "/system" : "/";
    const safeNext =
      next && next.startsWith("/") && (scope === "system" ? next.startsWith("/system") : !next.startsWith("/system"))
        ? next
        : fallback;
    navigate(safeNext, { replace: true });
  };
}

function MerchantLoginForm() {
  const finish = useFinishLogin();
  const form = useForm<MerchantValues>({
    resolver: zodResolver(merchantSchema),
    defaultValues: IS_DEV
      ? { tenant: "demo", email: "owner@demo.test", password: "password123" }
      : { tenant: "", email: "", password: "" },
  });
  const onSubmit = async (values: MerchantValues) => {
    try {
      const res = await login("tenant", values);
      authStore.set("tenant", {
        access_token: res.access_token,
        refresh_token: res.refresh_token,
        user: res.user,
        tenant_slug: values.tenant,
      });
      toast.success(`Welcome back, ${res.user.name.split(" ")[0]}`);
      finish("tenant");
    } catch (e) {
      applyApiErrors(e, form.setError);
    }
  };
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="tenant"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Store</FormLabel>
              <FormControl>
                <Input placeholder="your-store" autoComplete="organization" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@store.com" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <PasswordInput autoComplete="current-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <TbLoader2 className="animate-spin" />}
          Sign in to your store
        </Button>
      </form>
    </Form>
  );
}

function PlatformLoginForm() {
  const finish = useFinishLogin();
  const form = useForm<PlatformValues>({
    resolver: zodResolver(platformSchema),
    defaultValues: IS_DEV ? { email: "admin@zcommerce.test", password: "password123" } : { email: "", password: "" },
  });
  const onSubmit = async (values: PlatformValues) => {
    try {
      const res = await login("system", values);
      authStore.set("system", { access_token: res.access_token, refresh_token: res.refresh_token, user: res.user });
      toast.success(`Welcome back, ${res.user.name.split(" ")[0]}`);
      finish("system");
    } catch (e) {
      applyApiErrors(e, form.setError);
    }
  };
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="admin@zcommerce.test" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <PasswordInput autoComplete="current-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <TbLoader2 className="animate-spin" />}
          Sign in to platform
        </Button>
      </form>
    </Form>
  );
}

export function LoginPage() {
  const [sp, setSp] = useSearchParams();
  const tab = sp.get("scope") === "platform" ? "platform" : "merchant";

  return (
    <div className="relative grid min-h-screen lg:grid-cols-2">
      <div className="from-primary relative hidden overflow-hidden bg-gradient-to-br to-indigo-900 p-10 text-white lg:flex lg:flex-col">
        <div className="absolute -top-24 -right-24 size-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 size-72 rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="relative flex items-center gap-2.5 text-lg font-semibold">
          <div className="flex size-9 items-center justify-center rounded-lg bg-white/15 backdrop-blur">
            <TbBuildingStore className="size-5" />
          </div>
          zCommerce
        </div>
        <div className="relative mt-auto max-w-md space-y-4">
          <h2 className="text-3xl leading-tight font-semibold">Run your entire store from one beautiful dashboard.</h2>
          <p className="text-white/75">
            Products, orders, customers, SEO and storefront theming — everything your shop needs, in a single
            multi-tenant platform.
          </p>
          <div className="flex gap-6 pt-4 text-sm text-white/80">
            <div>
              <div className="text-2xl font-semibold text-white">Multi-tenant</div>
              SaaS ready
            </div>
            <div>
              <div className="text-2xl font-semibold text-white">SEO-first</div>
              Next.js storefront
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col">
        <div className="flex justify-end p-4">
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center p-6">
          <Card className="w-full max-w-md border-0 shadow-none sm:border sm:shadow-sm">
            <CardHeader className="space-y-1 text-center">
              <div className="bg-primary/10 text-primary mx-auto mb-2 flex size-12 items-center justify-center rounded-xl">
                {tab === "platform" ? <TbShieldCog className="size-6" /> : <TbBuildingStore className="size-6" />}
              </div>
              <CardTitle className="text-2xl">Sign in</CardTitle>
              <CardDescription>
                {tab === "platform" ? "Platform administrators" : "Merchant staff — manage your store"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs
                value={tab}
                onValueChange={(v) => {
                  const next = new URLSearchParams(sp);
                  next.set("scope", v);
                  next.delete("next");
                  setSp(next, { replace: true });
                }}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="merchant">
                    <TbBuildingStore /> Merchant
                  </TabsTrigger>
                  <TabsTrigger value="platform">
                    <TbShieldCog /> Platform
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              {tab === "merchant" ? <MerchantLoginForm /> : <PlatformLoginForm />}
              {IS_DEV && (
                <p className="text-muted-foreground text-center text-xs">Demo credentials are prefilled in development.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
