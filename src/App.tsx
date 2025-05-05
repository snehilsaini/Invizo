import SubscribedApp from "./_pages/SubscribedApp"
import { UpdateNotification } from "./components/UpdateNotification"
import {
  QueryClient,
  QueryClientProvider
} from "@tanstack/react-query"
import { useEffect, useState, useCallback } from "react"
import {
  Toast,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport
} from "./components/ui/toast"
import { ToastContext } from "./contexts/toast"
import { WelcomeScreen } from "./components/WelcomeScreen"
import { SettingsDialog } from "./components/Settings/SettingsDialog"
import { supabase } from "./lib/supabase"
import LoginPage from "./_pages/LoginPage"
import SubscribePage from "./_pages/SubscribePage"
import type { User } from '@supabase/supabase-js'
import { Routes, Route } from "react-router-dom"
import RegisterPage from "./_pages/RegisterPage"





// Create a React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      gcTime: Infinity,
      retry: 1,
      refetchOnWindowFocus: false
    },
    mutations: {
      retry: 1
    }
  }
})

// Root component that provides the QueryClient
function App() {
  const [toastState, setToastState] = useState({
    open: false,
    title: "",
    description: "",
    variant: "neutral" as "neutral" | "success" | "error"
  })
  const [credits, setCredits] = useState<number>(999) // Unlimited credits
  const [currentLanguage, setCurrentLanguage] = useState<string>("python")
  const [isInitialized, setIsInitialized] = useState(false)
  // const [hasApiKey, setHasApiKey] = useState(false)
  // const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false)
  // Note: Model selection is now handled via separate extraction/solution/debugging model settings

  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [subscriptionActive, setSubscriptionActive] = useState(false)

  // Set unlimited credits
  const updateCredits = useCallback(() => {
    setCredits(999) // No credit limit in this version
    window.__CREDITS__ = 999
  }, [])

  // Helper function to safely update language
  const updateLanguage = useCallback((newLanguage: string) => {
    setCurrentLanguage(newLanguage)
    window.__LANGUAGE__ = newLanguage
  }, [])

  // Helper function to mark initialization complete
  const markInitialized = useCallback(() => {
    setIsInitialized(true)
    window.__IS_INITIALIZED__ = true
  }, [])

  // Show toast method
  const showToast = useCallback(
    (
      title: string,
      description: string,
      variant: "neutral" | "success" | "error"
    ) => {
      setToastState({
        open: true,
        title,
        description,
        variant
      })
    },
    []
  )

  // useEffect(() => {
  //   // Listen for auth tokens from main process
  //   const handler = (_event: any, { access_token, refresh_token }: { access_token: string, refresh_token: string }) => {
  //     // Set the session in Supabase
  //     supabase.auth.setSession({ access_token, refresh_token });
  //     // Optionally, you can show a toast or update UI here
  //     console.log("Supabase session set from Electron protocol login!");
  //   };

  
  //   // Listen for the event
  //   window.electronAPI?.ipcRenderer?.on("auth-tokens", handler);
  
  //   // Cleanup
  //   return () => {
  //     window.electronAPI?.ipcRenderer?.removeListener("auth-tokens", handler);
  //   };
  // }, []);


  // useEffect(() => {
  //   // Listen for auth tokens from main process
  //   const handler = async (_event: any, { access_token, refresh_token }: { access_token: string, refresh_token: string }) => {
  //     // Set the session in Supabase
  //     await supabase.auth.setSession({ access_token, refresh_token });
  //     // Force a user refresh
  //     const { data: { user } } = await supabase.auth.getUser();
  //     setUser(user);
  //     // Optionally, you can show a toast or update UI here
  //     console.log("Supabase session set from Electron protocol login!");
  //   };
  
  //   window.electronAPI?.ipcRenderer?.on("auth-tokens", handler);
  
  //   return () => {
  //     window.electronAPI?.ipcRenderer?.removeListener("auth-tokens", handler);
  //   };
  // }, []);


  useEffect(() => {
    // Listen for auth tokens from main process
    const handler = async (_event: any, { access_token, refresh_token }: { access_token: string, refresh_token: string }) => {
      console.log("Received tokens in renderer:", access_token, refresh_token);
      // Set the session in Supabase
      const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
      console.log("setSession result:", data, error); // <-- Debug log here
      const userResult = await supabase.auth.getUser();
      console.log("User after setSession:", userResult); // <-- Debug log here
      if (error) {
        console.error("Failed to set session:", error);
        return;
      }
      // Wait for onAuthStateChange to fire and update user state
      // Optionally, you can force a refresh after a short delay
      setTimeout(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        console.log("Supabase session set and user refreshed from Electron protocol login!");
      }, 500);
    };
  
    // window.electronAPI?.ipcRenderer?.on("auth-tokens", handler);
    const unsubscribe = window.electronAPI?.onAuthTokens(handler);
return () => {
  if (unsubscribe) unsubscribe();
};
  
    return () => {
      window.electronAPI?.ipcRenderer?.removeListener("auth-tokens", handler);
    };
  }, []);

  // Check for OpenAI API key and prompt if not found
  // useEffect(() => {
  //   const checkApiKey = async () => {
  //     try { 
  //       const hasKey = await window.electronAPI.checkApiKey()
  //       setHasApiKey(hasKey)
        
  //       // If no API key is found, show the settings dialog after a short delay
  //       if (!hasKey) {
  //         setTimeout(() => {
  //           setIsSettingsOpen(true)
  //         }, 1000)
  //       }
  //     } catch (error) {
  //       console.error("Failed to check API key:", error)
  //     }
  //   }
    
  //   if (isInitialized) {
  //     checkApiKey()
  //   }
  // }, [isInitialized])

  // Initialize dropdown handler
  useEffect(() => {
    if (isInitialized) {
      // Process all types of dropdown elements with a shorter delay
      const timer = setTimeout(() => {
        // Find both native select elements and custom dropdowns
        const selectElements = document.querySelectorAll('select');
        const customDropdowns = document.querySelectorAll('.dropdown-trigger, [role="combobox"], button:has(.dropdown)');
        
        // Enable native selects
        selectElements.forEach(dropdown => {
          dropdown.disabled = false;
        });
        
        // Enable custom dropdowns by removing any disabled attributes
        customDropdowns.forEach(dropdown => {
          if (dropdown instanceof HTMLElement) {
            dropdown.removeAttribute('disabled');
            dropdown.setAttribute('aria-disabled', 'false');
          }
        });
        
        console.log(`Enabled ${selectElements.length} select elements and ${customDropdowns.length} custom dropdowns`);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isInitialized]);

  // Listen for settings dialog open requests
  useEffect(() => {
    const unsubscribeSettings = window.electronAPI.onShowSettings(() => {
      console.log("Show settings dialog requested");
      setIsSettingsOpen(true);
    });
    
    return () => {
      unsubscribeSettings();
    };
  }, []);

  // Fetch user on mount and listen for auth changes
  // useEffect(() => {
  //   supabase.auth.getUser().then(({ data: { user } }) => {
  //     setUser(user)
  //     setLoadingUser(false)
  //   })
  //   const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
  //     setUser(session?.user ?? null)
  //   })
  //   return () => subscription.unsubscribe()
  // }, [])


  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.error("Supabase getUser error:", error);
        }
        setUser(user);
      } catch (err) {
        console.error("Supabase getUser exception:", err);
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUser();
  
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Initialize basic app state
  useEffect(() => {
    // Load config and set values
    const initializeApp = async () => {
      try {
        // Set unlimited credits
        updateCredits()
        
        // Load config including language and model settings
        const config = await window.electronAPI.getConfig()
        
        // Load language preference
        if (config && config.language) {
          updateLanguage(config.language)
        } else {
          updateLanguage("python")
        }
        
        // Model settings are now managed through the settings dialog
        // and stored in config as extractionModel, solutionModel, and debuggingModel
        
        markInitialized()
      } catch (error) {
        console.error("Failed to initialize app:", error)
        // Fallback to defaults
        updateLanguage("python")
        markInitialized()
      }
    }
    
    initializeApp()

    // Event listeners for process events
    // const onApiKeyInvalid = () => {
    //   showToast(
    //     "API Key Invalid",
    //     "Your OpenAI API key appears to be invalid or has insufficient credits",
    //     "error"
    //   )
    //   setApiKeyDialogOpen(true)
    // }

    // // Setup API key invalid listener
    // window.electronAPI.onApiKeyInvalid(onApiKeyInvalid)

    // Define a no-op handler for solution success
    const unsubscribeSolutionSuccess = window.electronAPI.onSolutionSuccess(
      () => {
        console.log("Solution success - no credits deducted in this version")
        // No credit deduction in this version
      }
    )

    // Cleanup function
    return () => {
      // window.electronAPI.removeListener("API_KEY_INVALID", onApiKeyInvalid)
      unsubscribeSolutionSuccess()
      window.__IS_INITIALIZED__ = false
      setIsInitialized(false)
    }
  }, [updateCredits, updateLanguage, markInitialized, showToast])

  // API Key dialog management
  const handleOpenSettings = useCallback(() => {
    console.log('Opening settings dialog');
    setIsSettingsOpen(true);
  }, []);
  
  const handleCloseSettings = useCallback((open: boolean) => {
    console.log('Settings dialog state changed:', open);
    setIsSettingsOpen(open);
  }, []);

  // const handleApiKeySave = useCallback(async (apiKey: string) => {
  //   try {
  //     await window.electronAPI.updateConfig({ apiKey })
  //     setHasApiKey(true)
  //     showToast("Success", "API key saved successfully", "success")
      
  //     // Reload app after a short delay to reinitialize with the new API key
  //     setTimeout(() => {
  //       window.location.reload()
  //     }, 1500)
  //   } catch (error) {
  //     console.error("Failed to save API key:", error)
  //     showToast("Error", "Failed to save API key", "error")
  //   }
  // }, [showToast])

  useEffect(() => {
    if (user) {
      const fetchSubscriptionStatus = async () => {
        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("subscribed")
            .eq("id", user.id)
            .single();
          setSubscriptionActive(!!data?.subscribed);
        } catch (error) {
          console.error("Failed to fetch subscription status:", error);
        }
      };
      fetchSubscriptionStatus();
    }
  }, [user]);

  // useEffect(() => {
  //   if (loadingUser) return;
  //   if (!user) {
  //     console.log("User not logged in, but rendering main UI.");
  //   } else if (!subscriptionActive) {
  //     console.log("User not subscribed, but rendering main UI.");
  //   }
  // }, [loadingUser, user, subscriptionActive]);

  useEffect(() => {
    if (!loadingUser && !user) {
      console.log("User not logged in. Opening login page in a new window, but keeping main window visible.");
      // Open login page in a new window (browser)
      // window.open("https://your-login-page-url.com", "_blank", "noopener,noreferrer");
      // window.electronAPI.openExternal("http://localhost:54321/login");
      // You can also use a local route if you have a login page in your web app
      // window.open("/login", "_blank", "noopener,noreferrer");
    }
  }, [loadingUser, user]);

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ToastContext.Provider value={{ showToast }}>
          {/* <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={
              <div className="relative">
                {isInitialized ? (
                  hasApiKey ? (
                    <SubscribedApp
                      credits={credits}
                      currentLanguage={currentLanguage}
                      setLanguage={updateLanguage}
                    />
                  ) : (
                    <WelcomeScreen onOpenSettings={handleOpenSettings} />
                  )
                ) : (
                  <div className="min-h-screen bg-black flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-6 h-6 border-2 border-white/20 border-t-white/80 rounded-full animate-spin"></div>
                      <p className="text-white/60 text-sm">
                        Initializing...
                      </p>
                    </div>
                  </div>
                )}
                <UpdateNotification />
              </div>
            } />
          </Routes> */}

<Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={
            <div className="relative">
              {loadingUser ? (
                <div className="min-h-screen bg-black flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-6 h-6 border-2 border-white/20 border-t-white/80 rounded-full animate-spin"></div>
                    <p className="text-white/60 text-sm">
                      Checking authentication...
                    </p>
                  </div>
                </div>
              ) : !user ? (
                <LoginPage />
              ) : !subscriptionActive ? (
                <SubscribePage user={user} />
              ) : isInitialized ? (
                // hasApiKey ? (
                  <SubscribedApp
                    credits={credits}
                    currentLanguage={currentLanguage}
                    setLanguage={updateLanguage}
                  />
                ) : (
                  // <WelcomeScreen onOpenSettings={handleOpenSettings} />
                // )
              // ) : (
                <div className="min-h-screen bg-black flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-6 h-6 border-2 border-white/20 border-t-white/80 rounded-full animate-spin"></div>
                    <p className="text-white/60 text-sm">
                      Initializing...
                    </p>
                  </div>
                </div>
              )}
              <UpdateNotification />
            </div>
          } />
        </Routes>
          
          {/* Settings Dialog */}
          <SettingsDialog 
            open={isSettingsOpen} 
            onOpenChange={handleCloseSettings} 
          />
          
          <Toast
            open={toastState.open}
            onOpenChange={(open) =>
              setToastState((prev) => ({ ...prev, open }))
            }
            variant={toastState.variant}
            duration={1500}
          >
            <ToastTitle>{toastState.title}</ToastTitle>
            <ToastDescription>{toastState.description}</ToastDescription>
          </Toast>
          <ToastViewport />
        </ToastContext.Provider>
      </ToastProvider>
    </QueryClientProvider>
  )
}

export default App