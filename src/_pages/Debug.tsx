// Debug.tsx
import { useQuery, useQueryClient } from "@tanstack/react-query"
import React, { useEffect, useRef, useState } from "react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism"
import ScreenshotQueue from "../components/Queue/ScreenshotQueue"
import SolutionCommands from "../components/Solutions/SolutionCommands"
import { Screenshot } from "../types/screenshots"
import { ComplexitySection, ContentSection } from "./Solutions"
import { useToast } from "../contexts/toast"

const CodeSection = ({
  title,
  code,
  isLoading,
  currentLanguage
}: {
  title: string
  code: React.ReactNode
  isLoading: boolean
  currentLanguage: string
}) => {

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (typeof code === "string") {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };
  
  return (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
    <h2 className="text-[13px] font-medium text-white tracking-wide"></h2>
    <button
          onClick={handleCopy}
          className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded transition"
          disabled={isLoading}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    {isLoading ? (
      <div className="space-y-1.5">
        <div className="mt-4 flex">
          <p className="text-xs bg-gradient-to-r from-gray-300 via-gray-100 to-gray-300 bg-clip-text text-transparent animate-pulse">
            Loading solutions...
          </p>
        </div>
      </div>
    ) : (
      <div className="w-full">
        <SyntaxHighlighter
          showLineNumbers
          language={currentLanguage == "golang" ? "go" : currentLanguage}
          style={dracula}
          customStyle={{
            maxWidth: "100%",
            margin: 0,
            padding: "1rem",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
            backgroundColor: "rgba(22, 27, 34, 0.5)"
          }}
          wrapLongLines={true}
        >
          {code as string}
        </SyntaxHighlighter>
      </div>
    )}
  </div>
)
};

async function fetchScreenshots(): Promise<Screenshot[]> {
  try {
    const existing = await window.electronAPI.getScreenshots()
    console.log("Raw screenshot data in Debug:", existing)
    return (Array.isArray(existing) ? existing : []).map((p) => ({
      id: p.path,
      path: p.path,
      preview: p.preview,
      timestamp: Date.now()
    }))
  } catch (error) {
    console.error("Error loading screenshots:", error)
    throw error
  }
}

interface DebugProps {
  isProcessing: boolean
  setIsProcessing: (isProcessing: boolean) => void
  currentLanguage: string
  setLanguage: (language: string) => void
}

const Debug: React.FC<DebugProps> = ({
  isProcessing,
  setIsProcessing,
  currentLanguage,
  setLanguage
}) => {
  const [tooltipVisible, setTooltipVisible] = useState(false)
  const [tooltipHeight, setTooltipHeight] = useState(0)
  const { showToast } = useToast()

  const { data: screenshots = [], refetch } = useQuery<Screenshot[]>({
    queryKey: ["screenshots"],
    queryFn: fetchScreenshots,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false
  })

  // const [newCode, setNewCode] = useState<string | null>(null)
  // const [thoughtsData, setThoughtsData] = useState<string[] | null>(null)
  // const [timeComplexityData, setTimeComplexityData] = useState<string | null>( null )
  // const [spaceComplexityData, setSpaceComplexityData] = useState<string | null>( null )
  // const [debugAnalysis, setDebugAnalysis] = useState<string | null>(null)

  const [debugData, setDebugData] = useState<{
    issues_identified: string[],
    improvements: string[],
    optimizations: string[],
    explanation: string,
    key_points: string[],
    improved_code: string
  } | null>(null)



  const queryClient = useQueryClient()
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Try to get the new solution data from cache first
    // const newSolution = queryClient.getQueryData(["new_solution"]) as {
    //   code: string
    //   debug_analysis: string
    //   thoughts: string[]
    //   time_complexity: string
    //   space_complexity: string
    // } | null

    const newSolution = queryClient.getQueryData(["new_solution"]) as
  | {
      issues_identified: string[]
      improvements: string[]
      optimizations: string[]
      explanation: string
      key_points: string[]
      improved_code: string
    }
  | null

    // If we have cached data, set all state variables to the cached data
    // if (newSolution) {
    //   console.log("Found cached debug solution:", newSolution);
      
    //   if (newSolution.debug_analysis) {
    //     // Store the debug analysis in its own state variable
    //     // setDebugAnalysis(newSolution.debug_analysis);
    //     // Set code separately for the code section
    //     // setNewCode(newSolution.code || "// Debug mode - see analysis below");
        
    //     // Process thoughts/analysis points
    //     if (newSolution.debug_analysis.includes('\n\n')) {
    //       const sections = newSolution.debug_analysis.split('\n\n').filter(Boolean);
    //       // Pick first few sections as thoughts
    //       // setThoughtsData(sections.slice(0, 3));
    //     } else {
    //       // setThoughtsData(["Debug analysis based on your screenshots"]);
    //     }
    //   } else {
    //     // Fallback to code or default
    //     // setNewCode(newSolution.code || "// No analysis available");
    //     // setThoughtsData(newSolution.thoughts || ["Debug analysis based on your screenshots"]);
    //   }
    //   // setTimeComplexityData(newSolution.time_complexity || "N/A - Debug mode")
    //   // setSpaceComplexityData(newSolution.space_complexity || "N/A - Debug mode")
    //   setIsProcessing(false)
    // }

    if(newSolution) {
      setDebugData(newSolution);
      setIsProcessing(false);
    }

    // Set up event listeners
    const cleanupFunctions = [
      window.electronAPI.onScreenshotTaken(() => refetch()),
      window.electronAPI.onResetView(() => refetch()),
      // window.electronAPI.onDebugSuccess((data) => {
      //   console.log("Debug success event received with data:", data);
      //   queryClient.setQueryData(["new_solution"], data);
        
      //   // Also update local state for immediate rendering
      //   if (data.debug_analysis) {
      //     // Store the debug analysis in its own state variable
      //     setDebugAnalysis(data.debug_analysis);
      //     // Set code separately for the code section
      //     setNewCode(data.code || "// Debug mode - see analysis below");
          
      //     // Process thoughts/analysis points
      //     if (data.debug_analysis.includes('\n\n')) {
      //       const sections = data.debug_analysis.split('\n\n').filter(Boolean);
      //       // Pick first few sections as thoughts
      //       setThoughtsData(sections.slice(0, 3));
      //     } else if (data.debug_analysis.includes('\n')) {
      //       // Try to find bullet points or numbered lists
      //       const lines = data.debug_analysis.split('\n');
      //       const bulletPoints = lines.filter(line => 
      //         line.trim().match(/^[\d*\-•]+\s/) || 
      //         line.trim().match(/^[A-Z][\d\.\)\:]/) ||
      //         line.includes(':') && line.length < 100
      //       );
            
      //       if (bulletPoints.length > 0) {
      //         setThoughtsData(bulletPoints.slice(0, 5));
      //       } else {
      //         setThoughtsData(["Debug analysis based on your screenshots"]);
      //       }
      //     } else {
      //       setThoughtsData(["Debug analysis based on your screenshots"]);
      //     }
      //   } else {
      //     // Fallback to code or default
      //     setNewCode(data.code || "// No analysis available");
      //     setThoughtsData(data.thoughts || ["Debug analysis based on your screenshots"]);
      //     setDebugAnalysis(null);
      //   }
      //   setTimeComplexityData(data.time_complexity || "N/A - Debug mode");
      //   setSpaceComplexityData(data.space_complexity || "N/A - Debug mode");
        
      //   setIsProcessing(false);
      // }),

      window.electronAPI.onDebugSuccess((data) => {
        setDebugData(data); // data is now the JSON object from backend
        setIsProcessing(false);
      }),
      
      window.electronAPI.onDebugStart(() => {
        setIsProcessing(true)
      }),
      window.electronAPI.onDebugError((error: string) => {
        showToast(
          "Processing Failed",
          "There was an error debugging your code.",
          "error"
        )
        setIsProcessing(false)
        console.error("Processing error:", error)
      })
    ]

    // Set up resize observer
    const updateDimensions = () => {
      if (contentRef.current) {
        let contentHeight = contentRef.current.scrollHeight
        const contentWidth = contentRef.current.scrollWidth
        if (tooltipVisible) {
          contentHeight += tooltipHeight
        }
        window.electronAPI.updateContentDimensions({
          width: contentWidth,
          height: contentHeight
        })
      }
    }

    const resizeObserver = new ResizeObserver(updateDimensions)
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current)
    }
    updateDimensions()

    return () => {
      resizeObserver.disconnect()
      cleanupFunctions.forEach((cleanup) => cleanup())
    }
  }, [queryClient, setIsProcessing])

  const handleTooltipVisibilityChange = (visible: boolean, height: number) => {
    setTooltipVisible(visible)
    setTooltipHeight(height)
  }

  const handleDeleteExtraScreenshot = async (index: number) => {
    const screenshotToDelete = screenshots[index]

    try {
      const response = await window.electronAPI.deleteScreenshot(
        screenshotToDelete.path
      )

      if (response.success) {
        refetch()
      } else {
        console.error("Failed to delete extra screenshot:", response.error)
      }
    } catch (error) {
      console.error("Error deleting extra screenshot:", error)
    }
  }

  return (
    <div ref={contentRef} className="relative">
      <div className="space-y-3 px-4 py-3">
      {/* Conditionally render the screenshot queue */}
      <div className="bg-transparent w-fit">
        <div className="pb-3">
          <div className="space-y-3 w-fit">
            <ScreenshotQueue
              screenshots={screenshots}
              onDeleteScreenshot={handleDeleteExtraScreenshot}
              isLoading={isProcessing}
            />
          </div>
        </div>
      </div>

      {/* Navbar of commands with the tooltip */}
      <SolutionCommands
        screenshots={screenshots}
        onTooltipVisibilityChange={handleTooltipVisibilityChange}
        isProcessing={isProcessing}
        extraScreenshots={screenshots}
        credits={window.__CREDITS__}
        currentLanguage={currentLanguage}
        setLanguage={setLanguage}
      />

      {/* Main Content */}
      <div className="w-full text-sm text-black bg-black/60 rounded-md">
        <div className="rounded-lg overflow-hidden">
          <div className="px-4 py-3 space-y-4" style={{height: "80vh", overflowY: "auto" }}>
            {/* Thoughts Section */}
            {/* <ContentSection
              title="What I Changed"
              content={
                thoughtsData && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      {thoughtsData.map((thought, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <div className="w-1 h-1 rounded-full bg-blue-400/80 mt-2 shrink-0" />
                          <div>{thought}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              }
              isLoading={!thoughtsData}
            /> */}

            {/* Code Section */}
            {/* <CodeSection
              title="Original Code"
              // code={newCode}
              // isLoading={!newCode}
              currentLanguage={currentLanguage}
            /> */}
            
            {/* Debug Analysis Section */}


            {/* Complexity Section */}
            {/* <ComplexitySection
              // timeComplexity={timeComplexityData}
              // spaceComplexity={spaceComplexityData}
              // isLoading={!timeComplexityData || !spaceComplexityData}
            /> */}

            {/* Debug Results Section */}
{debugData ? (
  <div className="space-y-6">
    <ContentSection
      title="Issues Identified"
      content={
        debugData.issues_identified.length > 0
          ? (
            <ul className="list-disc pl-5">
              {debugData.issues_identified.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          )
          : <span className="text-gray-400">No issues identified.</span>
      }
      isLoading={false}
    />

    <ContentSection
      title="Improvements"
      content={
        debugData.improvements.length > 0
          ? (
            <ul className="list-disc pl-5">
              {debugData.improvements.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          )
          : <span className="text-gray-400">No improvements suggested.</span>
      }
      isLoading={false}
    />

    <ContentSection
      title="Optimizations"
      content={
        debugData.optimizations.length > 0
          ? (
            <ul className="list-disc pl-5">
              {debugData.optimizations.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          )
          : <span className="text-gray-400">No optimizations suggested.</span>
      }
      isLoading={false}
    />

    <ContentSection
      title="Explanation"
      content={debugData.explanation || <span className="text-gray-400">No explanation provided.</span>}
      isLoading={false}
    />

    <ContentSection
      title="Key Points"
      content={
        debugData.key_points.length > 0
          ? (
            <ul className="list-disc pl-5">
              {debugData.key_points.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          )
          : <span className="text-gray-400">No key points.</span>
      }
      isLoading={false}
    />

    <CodeSection
      title="Improved Code"
      code={debugData.improved_code || "// No improved code provided."}
      isLoading={false}
      currentLanguage={currentLanguage}
    />
  </div>
) : (
  <div className="text-gray-400 text-center py-8">No debug results yet.</div>
)}
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}

export default Debug
