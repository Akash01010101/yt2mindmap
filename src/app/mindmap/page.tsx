"use client";
import { useEffect, useRef } from "react";
import { MindmapEditor } from "@/components/mirrorEditor";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { EditorView } from "codemirror";
import { useSession } from "next-auth/react";
import { YouTubeEmbed } from '@next/third-parties/google';
import Turnstile from "@/components/Turnstile";
import PricingPortal from "@/components/PricingPortal";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { TaskadeSidebar } from "@/components/TaskadeSidebar"
import { useNextStep } from "nextstepjs"
import { HtmlContentProvider, useHtmlContentContext } from "@/contexts/HTMLContextProvider";
import { useMindmapState } from "@/contexts/MindmapStateProvider";
import { useTaskContext } from "@/contexts/TaskProvider";
import { useSaveHtmlContent, useMindmapActions } from "@/hooks/all-hooks";
export default function Home() {
  const { data: session } = useSession();
  const editorRef = useRef<EditorView | null>(null);
  const { isVerified, setIsVerified, loading, inputValue, setInputValue, saving, mode, setMode, showPricing, setShowPricing, error } = useMindmapState();
  const { currentLoadingStep, loadingMessages, messageIndex } = useTaskContext();
  const { htmlContent, setHtmlContent } = useHtmlContentContext();
  const { loadSavedMindmap } = useSaveHtmlContent(editorRef);
  const { handleSave, handleSubmitWebhook, enterFullscreen, fixSyntax } = useMindmapActions(editorRef);
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial') === 'true';
    if (!hasSeenTutorial) {
      handleStartTour();
      localStorage.setItem('hasSeenTutorial', 'true');
    }
    const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const mindmapId = urlParams?.get("id");
    if (mindmapId) {
      loadSavedMindmap(mindmapId);
    }
  }, []);
  // Use the tour functionality
  const { startNextStep } = useNextStep();
  const handleStartTour = () => {
    startNextStep("mainTour");
  };
  return (
    <>
      <div className="flex h-screen relative">
        <PricingPortal isOpen={showPricing} />
        {session && (
          <SidebarProvider>
            <AppSidebar />
            <SidebarTrigger />
          </SidebarProvider>
        )}
        <div className="flex-1 flex flex-col items-center pb-[80px]"> {/* Added padding-bottom for footer */}
          {/* Top section: Input and Controls */}
          <div className="w-full flex flex-col items-center justify-start pt-8 pb-4">
            <div className="flex flex-col items-center gap-4">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-6">
                Youtube to <span className="text-blue-600">MindMap</span>
              </h1>
              <div className="flex gap-2 mb-6">
                <Button
                  variant={mode === 'youtube' ? 'default' : 'outline'}
                  onClick={() => setMode('youtube')}
                >
                  YouTube
                </Button>
                <Button
                  variant={mode === 'longtext' ? 'default' : 'outline'}
                  onClick={() => setMode('longtext')}
                >
                  Long Text
                </Button>
              </div>
            </div>
            {!isVerified ? (
              <div className="flex flex-col items-center">
                <p className="mb-4 text-gray-600">Please complete the verification to continue</p>
                {(
                  <Turnstile
                    onVerify={async () => {
                      try {
                        const response = await fetch("/api/chat-usage", {
                          method: "GET",
                        });
                        const data = await response.json();
                        if (data.usage_count > 3 && !data.isSubscribed && !data.isPaid) {
                          setShowPricing(true);
                        } else {
                          setIsVerified(true);
                        }
                      } catch (error) {
                        console.error("Error updating usage count:", error);
                        setIsVerified(true);
                      }
                    }}
                  />
                )}
              </div>
            ) : (
              <>
                <Input
                  id="input"
                  placeholder="Mindmap content"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="pl-2 pr-2 w-1/2 justify-center mb-6"
                />
                <Button variant="default" onClick={handleSubmitWebhook} disabled={loading}>
                  {loading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Generate Mindmap'}
                </Button>
                {error ? <p className="text-red-600">{error}</p> : null}
              </>
            )}
            {loading && (
              <div className="justify-center">
                <p>{loadingMessages[messageIndex]}</p>
                {currentLoadingStep && (
                  <div className="mt-2 text-center">
                    <p className="text-sm text-gray-600 capitalize">{currentLoadingStep}</p>
                    <div className="w-64 h-2 bg-gray-200 rounded-full mt-2">
                    </div>
                  </div>
                )}
              </div>
            )}
            {inputValue.includes("https://www.youtube.com/") && (
              <div className="justify-center mt-3">
                <YouTubeEmbed videoid={inputValue.split("=")[1]} height={8} />
                <iframe></iframe>
              </div>
            )}
          </div>

          {/* Middle section: Mindmap Iframe */}
          <HtmlContentProvider>
            <MindmapEditor editorRef={editorRef} htmlContent={htmlContent} setHtmlContent={setHtmlContent} />
          </HtmlContentProvider>
          {/* Bottom section: Buttons and Editor */}
          <div className="w-full flex flex-col items-center">
            <div className="flex space-x-2 mb-4 mt-10" id="buttons">
              <Button variant="outline" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="animate-spin w-4 h-4" /> : 'Save Changes'}
              </Button>
              <Button variant="outline" onClick={enterFullscreen}>Go Fullscreen</Button>
              <Button variant="outline" onClick={fixSyntax}>Fix Syntax</Button>
              <Button variant="outline" onClick={handleStartTour}>Show tour</Button>
            </div>
          </div>
        </div>
        <TaskadeSidebar />
      </div>
    </>
  );
}
export const dynamic = 'force-dynamic';
