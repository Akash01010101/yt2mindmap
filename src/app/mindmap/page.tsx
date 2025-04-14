"use client";
import { useEffect, useState, useRef } from "react";
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
import {useNextStep } from "nextstepjs"
import { HtmlContentProvider, useHtmlContentContext } from "@/contexts/HTMLContextProvider";
import { useFetchHtmlContent, useSaveHtmlContent } from "@/hooks/all-hooks";

export default function Home() {
  const { data: session } = useSession();
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const editorRef = useRef<EditorView | null>(null);
  const [saving, setSaving] = useState(false);
  const [TaskId, setTaskId] = useState('');
  const [mode, setMode] = useState<'youtube' | 'longtext' >('youtube');
  const [showPricing, setShowPricing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { htmlContent, setHtmlContent } = useHtmlContentContext();
  const { fetchHtmlContent } = useFetchHtmlContent(editorRef);
  const { loadSavedMindmap } = useSaveHtmlContent(editorRef);

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
   const { startNextStep } = useNextStep();
   const handleStartTour = () => {
    startNextStep("mainTour");
  };


  const handleSave = async () => {
    if (!session?.user?.email) {
      console.error('User not authenticated');
      return;
    }
    setSaving(true);
    try {
      const currentHtml = editorRef.current?.state.doc.toString() || htmlContent;
      const urlParams = new URLSearchParams(window.location.search);
      const mindmapId = urlParams.get('id');
      const endpoint = mindmapId ? `/api/mindmaps/${mindmapId}` : `/api/mindmaps/${TaskId}`;
      const method = mindmapId ? 'PUT' : 'POST';
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `Mindmap - ${new Date().toLocaleString()}`,
          youtubeUrl: inputValue,
          htmlContent: currentHtml,
        }),
      });
      if (response.ok) {
        console.log('Mindmap saved:', await response.json());
      } else {
        console.error('Failed to save mindmap');
      }
    } catch (error) {
      console.error('Error saving mindmap:', error);
    } finally {
      setSaving(false);
    }
  };


  const handleSubmitWebhook = async () => {
    setLoading(true);
    setError(null);
    try {
      // Extract video ID from URL
      if(mode == "youtube"){
        const videoId = inputValue.split('v=')[1]?.split('&')[0];
      if (!videoId) {
        setError('Invalid YouTube URL');
        setLoading(false);
        return;
      }

      // Check for subtitles first
      const subtitleCheckResponse = await fetch('/api/check-subtitles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId }),
      });

      const subtitleData = await subtitleCheckResponse.json();
      if (!subtitleData.hasSubtitles) {
        setError('This video does not have subtitles available');
        setLoading(false);
        return;
      }

      }
      const taskId = Math.random().toString(36).substring(2);
      const response = await fetch('/api/yt-transcript-webhook-old', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: inputValue, taskId }),
      });

      if (response.ok) {
        // Increment chat usage count
        await fetch('/api/chat-usage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        await fetch('/api/webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId, email: session?.user?.email }),
        });
        console.log("Webhook submitted successfully.");
        await checkTaskStatus(taskId);
      } else {
        console.error("Failed to submit webhook:", await response.text());
        setError('Failed to process video');
      }
    } catch (error) {
      console.error("Error submitting webhook:", error);
      setError('An error occurred while processing the video');
    } finally {
      setLoading(false);
    }
  };
  const [CurrentloadingStep, setCurrentloadingSteps] = useState('');
  const loadingMessages = [
    'Processing video transcript...',
    'Analyzing content structure...',
    'Generating mindmap layout...',
    'Optimizing node connections...',
    'Applying visual styles...',
    'Finalizing mindmap...'
  ];
  const [messageIndex, setMessageIndex] = useState(0);

  const checkTaskStatus = async (taskId: string, maxRetries = 20, interval = 5000) => {
    let attempts = 0;
    const messageInterval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % loadingMessages.length);
    }, 10000);

    while (attempts < maxRetries) {
      try {
        const res = await fetch(`/api/webhook?taskId=${taskId}`);
        const data = await res.json();
        setCurrentloadingSteps(data.status);
        console.log(data);
        if (data.task.status == 'complete') {
          clearInterval(messageInterval);
          setLoading(false);
          setError(null);
          console.log("Task completed");
          await new Promise(resolve => setTimeout(resolve, 2000));
          fetchHtmlContent(taskId);
          setTaskId(taskId);
          return data.data;
        }
        await new Promise(resolve => setTimeout(resolve, interval));
        attempts++;
      } catch (error) {
        console.error("Error checking task status:", error);
        clearInterval(messageInterval);
      }
    }
    console.error("Task polling timed out.");
    clearInterval(messageInterval);
  };
  const enterFullscreen = () => {
    const iframe = document.getElementById('mindmap') as HTMLIFrameElement;
    if (iframe?.requestFullscreen) {
      iframe.requestFullscreen();
    }
  };
  return (
    <>

        <div className="flex h-screen relative">
        <PricingPortal isOpen={showPricing} />
        {session && (
          <SidebarProvider>
            <AppSidebar/>
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
                    {loading? <Loader2 className="animate-spin w-4 h-4" /> : 'Generate Mindmap'}
                  </Button>
             
                {error ? <p className="text-red-600">{error}</p> : null}
              </>
            )}
            {loading && (
              <div className="justify-center">
                <p>{loadingMessages[messageIndex]}</p>
                {CurrentloadingStep && (
                  <div className="mt-2 text-center">
                    <p className="text-sm text-gray-600 capitalize">{CurrentloadingStep}</p>
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
            <MindmapEditor editorRef={editorRef} htmlContent={htmlContent} setHtmlContent={setHtmlContent}/>
          </HtmlContentProvider>
            
          {/* Bottom section: Buttons and Editor */}
          <div className="w-full flex flex-col items-center">
            <div className="flex space-x-2 mb-4 mt-10" id="buttons">
            <Button variant="outline" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="animate-spin w-4 h-4" /> : 'Save Changes'}
            </Button>
            <Button variant="outline" onClick={enterFullscreen}>Go Fullscreen</Button>
            <Button variant="outline" onClick={() => {
              if (editorRef.current) {
                const currentContent = editorRef.current.state.doc.toString();
                const fixedContent = currentContent.replace(/\\n/g, '');
                editorRef.current.dispatch({
                  changes: { from: 0, to: editorRef.current.state.doc.length, insert: fixedContent }
                });
              }
            }}>Fix Syntax</Button>
            <Button variant="outline" onClick={handleStartTour}>Show tour</Button>
          </div>


          </div>
          
        </div>
        <TaskadeSidebar/>
      </div>


     
      
    </>
  );
}

export const dynamic = 'force-dynamic';
