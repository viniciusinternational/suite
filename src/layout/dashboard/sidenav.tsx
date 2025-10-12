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
import { getNavigationForRole } from '@/lib/navigation';
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
  
  // Get navigation items for current user role
  const navigationItems = getNavigationForRole(userRole);
  
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
              <Badge variant="secondary" className="ml-auto h-5 px-2 text-xs">
                {item.badge}
              </Badge>
            )}
            {isOpen ? (
              <ChevronDown className="h-4 w-4 ml-auto" />
            ) : (
              <ChevronRight className="h-4 w-4 ml-auto" />
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
                    <Dot className="h-4 w-4" />
                    {renderIcon(child.icon, "h-4 w-4")}
                    <span>{child.label}</span>
                    {child.badge && (
                      <Badge variant="secondary" className="ml-auto h-5 px-2 text-xs">
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
            <Badge variant="secondary" className="ml-auto h-5 px-2 text-xs">
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
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              ViniSuite
            </h1>
            <p className="text-xs text-muted-foreground font-medium">
              Construction Management
            </p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Current Role</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="rounded-lg bg-muted/50 p-3 border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Current Role
              </p>
              <p className="text-sm font-medium text-foreground mt-1">
                {formatRole(userRole)}
              </p>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
        
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
        <div className="flex items-center space-x-3 p-3 rounded-xl bg-muted/50 border">
          <Avatar className="h-10 w-10 ring-2 ring-muted">
            <AvatarImage src={user?.avatar} alt={user?.fullName || ''} />
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
              {user && user.fullName ? getUserInitials(user.fullName) : 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {user?.fullName || 'Current User'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email || 'user@vinisuite.com'}
            </p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};
