"use client";
import { getSessionData } from "@/utils/appwrite";
import "@/app/globals.css";
import { SidebarProvider } from "@/utils/SidebarContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GameAddedProvider } from "@/utils/GameAddedContext";
import { AppSidebar } from "@/components/layout/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider as UiSidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);

  //logout fallback
  useEffect(() => {
    getSessionData()
      .then((data) => {
        if (data) {
          setLoggedIn(true);
        } else {
          setLoggedIn(false);
          router.push("/");
        }
      })
      .catch((error) => {
        console.log(error);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {loggedIn && (
        <GameAddedProvider>
          <SidebarProvider>
            <UiSidebarProvider>
              <AppSidebar />
              <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                  <div className="flex items-center gap-2 px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator
                      orientation="vertical"
                      className="mr-2 data-[orientation=vertical]:h-4"
                    />
                    <Breadcrumb>
                      <BreadcrumbList>
                        <BreadcrumbItem className="hidden md:block">
                          <BreadcrumbLink href="/">
                            Home
                          </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className="hidden md:block" />
                        <BreadcrumbItem>
                          <BreadcrumbPage>Dashboard</BreadcrumbPage>
                        </BreadcrumbItem>
                      </BreadcrumbList>
                    </Breadcrumb>
                  </div>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                  <div className="max-h-full">{children}</div>
                </div>
              </SidebarInset>
            </UiSidebarProvider>
          </SidebarProvider>
        </GameAddedProvider>
      )}
    </>
  );
}
