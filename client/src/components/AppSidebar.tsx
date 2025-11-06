import { LayoutDashboard, Users, CreditCard, UserCircle, Store, LogOut } from "lucide-react";
import { useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";

export function AppSidebar() {
  const [location] = useLocation();
  const { logout, user } = useAuth();
  const { t } = useLanguage();

  const menuItems = [
    {
      title: t("sidebar.dashboard"),
      url: "/",
      icon: LayoutDashboard,
    },
    {
      title: t("sidebar.customers"),
      url: "/customers",
      icon: Users,
    },
    {
      title: t("sidebar.credits"),
      url: "/credits",
      icon: CreditCard,
    },
    {
      title: t("sidebar.profile"),
      url: "/profile",
      icon: UserCircle,
    },
    {
      title: t("sidebar.store"),
      url: "/store",
      icon: Store,
    },
  ];

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-bold px-4 py-6">
            Credit Manager
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`link-${item.title.toLowerCase()}`}
                  >
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="flex flex-col gap-2">
          <div className="text-sm text-muted-foreground px-2">
            {user?.email}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            data-testid="button-logout"
            className="w-full justify-start"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {t("sidebar.logout")}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
