import { useHtmlContentContext } from "@/contexts/HTMLContextProvider";
import { useMindmapState } from "@/contexts/MindmapStateProvider";
import { useTaskContext } from "@/contexts/TaskProvider";
import { useSession } from "next-auth/react";
import { EditorView } from "codemirror";

export function useFetchHtmlContent(editorRef: React.RefObject<EditorView | null>) {
  const { setHtmlContent } = useHtmlContentContext();
  const { data:session } = useSession();
  const fetchHtmlContent = async (taskId: string) => {
    try {
      const userEmail = session?.user?.email || 'anonymous';
      const response = await fetch(`https://yt2mapapi.blob.core.windows.net/html/user-${userEmail.split('@')[0]}/${taskId}.html`, { cache: 'no-store' });
      const text = await response.text();
      setHtmlContent(text);
      if (editorRef.current) {
        editorRef.current.dispatch({
          changes: { from: 0, to: editorRef.current.state.doc.length, insert: text },
        });
      }
    } catch (error) {
      console.error('Error fetching HTML content:', error);
    } 
  };


  return { fetchHtmlContent };
}

export function useSaveHtmlContent(editorRef: React.RefObject<EditorView | null>) {
  const { setHtmlContent } = useHtmlContentContext();

  const loadSavedMindmap = async (id: string) => {
    try {
      const response = await fetch(`/api/mindmaps/${id}`);
      if (response.ok) {
        const data = await response.json();
        setHtmlContent(data.htmlContent);
        if (editorRef.current) {
          editorRef.current.dispatch({
            changes: { from: 0, to: editorRef.current.state.doc.length, insert: data.htmlContent },
          });
        }
      }
    } catch (error) {
      console.error("Error loading mindmap:", error);
    }
  };

  return { loadSavedMindmap };
}

export function useMindmapActions(editorRef: React.RefObject<EditorView | null>) {
  const { data: session } = useSession();
  const { inputValue, setSaving, setError, setLoading } = useMindmapState();
  const { taskId, setTaskId, checkTaskStatus } = useTaskContext();
  const { fetchHtmlContent } = useFetchHtmlContent(editorRef);
  const { htmlContent } = useHtmlContentContext();

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
      const endpoint = mindmapId ? `/api/mindmaps/${mindmapId}` : `/api/mindmaps/${taskId}`;
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
      // Extract video ID from URL if in YouTube mode
      if (inputValue.includes('youtube.com') || inputValue.includes('youtu.be')) {
        const videoId = inputValue.split('v=')[1]?.split('&')[0] || 
                       inputValue.split('youtu.be/')[1]?.split('?')[0];
        
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
      
      const newTaskId = Math.random().toString(36).substring(2);
      const response = await fetch('/api/yt-transcript-webhook-old', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: inputValue, taskId: newTaskId }),
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
          body: JSON.stringify({ taskId: newTaskId, email: session?.user?.email }),
        });
        console.log("Webhook submitted successfully.");
        const result = await checkTaskStatus(newTaskId);
        setLoading(false);
        setError(null);
        await new Promise(resolve => setTimeout(resolve, 2000));
        fetchHtmlContent(newTaskId);
        setTaskId(newTaskId);
        return result;
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

  const enterFullscreen = () => {
    const iframe = document.getElementById('mindmap') as HTMLIFrameElement;
    if (iframe?.requestFullscreen) {
      iframe.requestFullscreen();
    }
  };

  const fixSyntax = () => {
    if (editorRef.current) {
      const currentContent = editorRef.current.state.doc.toString();
      const fixedContent = currentContent.replace(/\\n/g, '');
      editorRef.current.dispatch({
        changes: { from: 0, to: editorRef.current.state.doc.length, insert: fixedContent }
      });
    }
  };

  return { handleSave, handleSubmitWebhook, enterFullscreen, fixSyntax };
}