"use client";

import type {
  SynthesizedResult,
  AnalysisResponseRecord,
} from "@/lib/ai/types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./Tabs";
import { MainResultsView } from "./MainResultsView";
import { ProviderDetailsView } from "./ProviderDetailsView";

interface ResultsContentProps {
  finalResult: SynthesizedResult;
  v1Responses: AnalysisResponseRecord[];
  v2Responses: AnalysisResponseRecord[];
}

export function ResultsContent({
  finalResult,
  v1Responses,
  v2Responses,
}: ResultsContentProps) {
  const totalResponses = v1Responses.length + v2Responses.length;

  return (
    <Tabs defaultValue="results">
      <TabsList>
        <TabsTrigger value="results">Results</TabsTrigger>
        <TabsTrigger value="providers">
          Provider Details ({totalResponses})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="results">
        <MainResultsView finalResult={finalResult} />
      </TabsContent>

      <TabsContent value="providers">
        <ProviderDetailsView
          v1Responses={v1Responses}
          v2Responses={v2Responses}
        />
      </TabsContent>
    </Tabs>
  );
}
