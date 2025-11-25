'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard,
  Users,
  Building2,
  FolderOpen,
  UserCheck,
  Settings,
  BarChart3,
  CreditCard,
  FileText,
  CheckCircle,
  DollarSign,
  Calendar,
  FolderCheck,
  ShoppingCart,
  CheckSquare,
  Star,
  UserPlus,
  User,
  Clock,
  ChevronDown,
  ChevronRight,
  Dot,
  TrendingUp,
  Calculator,
  Archive,
  FilePlus,
  HelpCircle
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getNavigationForPermissions } from '@/lib/navigation';
import type { NavigationItem, UserRole, User as UserType } from '@/types';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';

// Icon mapping for dynamic icon rendering
const iconMap = {
  LayoutDashboard,
  Users,
  Building2,
  FolderOpen,
  UserCheck,
  Settings,
  BarChart3,
  CreditCard,
  FileText,
  CheckCircle,
  DollarSign,
  Calendar,
  FolderCheck,
  ShoppingCart,
  CheckSquare,
  Star,
  UserPlus,
  User,
  Clock,
  TrendingUp,
  Calculator,
  Archive,
  FilePlus,
  HelpCircle,
};

interface DashboardSidebarProps {
  userRole: UserRole;
  user: UserType | null;
}

export const DashboardSidebar = ({ userRole, user }: DashboardSidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  
  // Get navigation items filtered by user permissions
  const navigationItems = getNavigationForPermissions(user);
  
  // Track which menu items are open
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  
  // Check if current path matches navigation item
  const isActive = (href?: string) => {
    if (!href) return false;
    return pathname === href || pathname.startsWith(href + '/');
  };
  
  // Check if any child is active
  const hasActiveChild = (children?: NavigationItem[]) => {
    if (!children) return false;
    return children.some(child => isActive(child.href));
  };
  
  // Toggle submenu open/closed
  const toggleItem = (itemId: string) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(itemId)) {
      newOpenItems.delete(itemId);
    } else {
      newOpenItems.add(itemId);
    }
    setOpenItems(newOpenItems);
  };
  
  // Render navigation icon
  const renderIcon = (iconName: string, className = "h-5 w-5") => {
    const IconComponent = iconMap[iconName as keyof typeof iconMap];
    if (IconComponent) {
      return <IconComponent className={className} />;
    }
    // Fallback icon if not found
    return <LayoutDashboard className={className} />;
  };

  // Format role for display
  const formatRole = (role: UserRole) => {
    return role
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get user initials
  const getUserInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  // Render navigation item
  const renderNavigationItem = (item: NavigationItem) => {
    const hasChildren = item.children && item.children.length > 0;
    const isItemActive = isActive(item.href);
    const hasActiveChildItem = hasActiveChild(item.children);
    const isOpen = openItems.has(item.id) || hasActiveChildItem;
    
    if (hasChildren) {
      return (
        <SidebarMenuItem key={item.id}>
          <SidebarMenuButton
            onClick={() => toggleItem(item.id)}
            isActive={hasActiveChildItem}
            tooltip={item.label}
          >
            {renderIcon(item.icon, "h-4 w-4")}
            <span>{item.label}</span>
            {item.badge && (
              <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-[10px] font-medium">
                {item.badge}
              </Badge>
            )}
            {isOpen ? (
              <ChevronDown className="h-3.5 w-3.5 ml-auto opacity-60" strokeWidth={2.5} />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 ml-auto opacity-60" strokeWidth={2.5} />
            )}
          </SidebarMenuButton>
          
          {isOpen && (
            <SidebarMenuSub>
              {item.children?.map((child) => (
                <SidebarMenuSubItem key={child.id}>
                  <SidebarMenuSubButton
                    onClick={() => child.href && router.push(child.href)}
                    isActive={isActive(child.href)}
                  >
                    <Dot className="h-3 w-3 opacity-50" strokeWidth={3} />
                    {renderIcon(child.icon, "h-3.5 w-3.5")}
                    <span>{child.label}</span>
                    {child.badge && (
                      <Badge variant="secondary" className="ml-auto h-4 px-1.5 text-[10px] font-medium">
                        {child.badge}
                      </Badge>
                    )}
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          )}
        </SidebarMenuItem>
      );
    }
    
    return (
      <SidebarMenuItem key={item.id}>
        <SidebarMenuButton
          onClick={() => item.href && router.push(item.href)}
          isActive={isItemActive}
          tooltip={item.label}
        >
          {renderIcon(item.icon, "h-4 w-4")}
          <span>{item.label}</span>
          {item.badge && (
            <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-[10px] font-medium">
              {item.badge}
            </Badge>
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };
  
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-3 px-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-sm">
            <Building2 className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold tracking-tight text-foreground">
              ViniSuite
            </h1>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map(renderNavigationItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <div className="space-y-2">
          <div className="px-2 py-1.5">
            <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-sidebar-accent/50">
              <div className="flex h-6 items-center justify-center rounded-md bg-primary/10 px-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                  {formatRole(userRole)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-sidebar-accent/50">
            <Avatar className="h-9 w-9 border-2 border-sidebar-border/50">
              <AvatarImage src={user?.avatar} alt={user?.fullName || ''} />
              <AvatarFallback className="bg-gradient-to-br from-primary/90 to-primary text-primary-foreground font-semibold text-xs">
                {user && user.fullName ? getUserInitials(user.fullName) : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate leading-tight">
                {user?.fullName || 'Current User'}
              </p>
              <p className="text-xs text-muted-foreground truncate leading-tight mt-0.5">
                {user?.email || 'user@vinisuite.com'}
              </p>
            </div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};
