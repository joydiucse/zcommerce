import { TbMail, TbShieldCheck } from "react-icons/tb";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/common/page-header";
import { useMe } from "@/hooks/use-auth";
import { initials } from "@/lib/utils";

export function SystemProfilePage() {
  const me = useMe();
  const user = me.data?.user;
  const perms = me.data?.permissions ?? [];
  return (
    <>
      <PageHeader title="Your profile" breadcrumbs={[{ label: "Account" }, { label: "Profile" }]} />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 text-center">
            <Avatar className="size-20">
              <AvatarFallback className="text-xl">{initials(user?.name)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold">{user?.name}</div>
              <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
                <TbMail className="size-4" /> {user?.email}
              </div>
            </div>
            {user?.role?.name && <Badge variant="secondary">{user.role.name}</Badge>}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TbShieldCheck className="text-primary" /> Permissions
            </CardTitle>
            <CardDescription>
              Profile and password changes for platform users are managed by a super-admin from System users.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1.5">
            {perms.includes("*") ? (
              <Badge>Full access (*)</Badge>
            ) : (
              perms.map((p) => (
                <Badge key={p} variant="outline" className="font-mono">
                  {p}
                </Badge>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
