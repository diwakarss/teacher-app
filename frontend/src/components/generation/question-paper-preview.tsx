'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  FileQuestion,
  Clock,
  Award,
  Eye,
  EyeOff,
  CheckCircle,
} from 'lucide-react';
import type { QuestionPaperOutput, Section, Question } from '@/lib/prompts/question-paper-prompt';
import type { QuestionPaperWithParsed } from '@/services/question-paper-service';

interface QuestionPaperPreviewProps {
  paper: QuestionPaperOutput | QuestionPaperWithParsed;
}

function QuestionDisplay({ question, sectionPrefix }: { question: Question; sectionPrefix: string }) {
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <div className="rounded-md border p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-primary">
              {sectionPrefix}{question.number}.
            </span>
            <Badge variant="outline" className="text-xs">
              {question.marks} {question.marks === 1 ? 'mark' : 'marks'}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {question.type.replace('_', ' ')}
            </Badge>
          </div>
          <p className="mt-1 whitespace-pre-wrap">{question.text}</p>

          {question.options && question.options.length > 0 && (
            <ul className="mt-2 space-y-1 pl-4">
              {question.options.map((opt, i) => (
                <li key={i} className="text-sm">
                  {opt}
                </li>
              ))}
            </ul>
          )}

          {showAnswer && (
            <div className="mt-2 rounded bg-green-50 p-2 text-sm text-green-700">
              <span className="font-medium">Answer: </span>
              {question.answer}
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setShowAnswer(!showAnswer)}
        >
          {showAnswer ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

function SectionDisplay({ section, prefix }: { section: Section; prefix: string }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-md bg-muted p-3">
        <div>
          <h4 className="font-medium">{section.name}</h4>
          <p className="text-sm text-muted-foreground">{section.instructions}</p>
        </div>
        <Badge>
          {section.totalMarks} marks
        </Badge>
      </div>
      <div className="space-y-2">
        {section.questions.map((question) => (
          <QuestionDisplay
            key={question.number}
            question={question}
            sectionPrefix={prefix}
          />
        ))}
      </div>
    </div>
  );
}

export function QuestionPaperPreview({ paper }: QuestionPaperPreviewProps) {
  const [showAllAnswers, setShowAllAnswers] = useState(false);

  // Normalize paper format
  const normalizedPaper: QuestionPaperOutput = 'parsedSections' in paper
    ? {
        name: paper.name,
        header: {
          schoolName: '[School Name]',
          examName: paper.template.replace('_', ' ').toUpperCase(),
          subject: '',
          duration: `${paper.duration} minutes`,
          maxMarks: paper.totalMarks,
          instructions: [],
        },
        sections: paper.parsedSections,
        answerKey: paper.parsedAnswerKey,
      }
    : paper;

  const sectionPrefixes = ['A', 'B', 'C', 'D', 'E'];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileQuestion className="h-5 w-5 text-primary" />
          {normalizedPaper.name}
        </CardTitle>
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Award className="h-4 w-4" />
            {normalizedPaper.header.maxMarks} marks
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {normalizedPaper.header.duration}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="paper">
          <TabsList className="mb-4">
            <TabsTrigger value="paper">Question Paper</TabsTrigger>
            <TabsTrigger value="answers">Answer Key</TabsTrigger>
          </TabsList>

          <TabsContent value="paper" className="space-y-4">
            {/* Instructions */}
            {normalizedPaper.header.instructions.length > 0 && (
              <div className="rounded-md border p-3">
                <h4 className="mb-2 font-medium">General Instructions</h4>
                <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
                  {normalizedPaper.header.instructions.map((inst, i) => (
                    <li key={i}>{inst}</li>
                  ))}
                </ol>
              </div>
            )}

            {/* Sections */}
            <Accordion
              type="multiple"
              defaultValue={normalizedPaper.sections.map((_, i) =>
                `section-${i}`
              )}
              className="w-full"
            >
              {normalizedPaper.sections.map((section, i) => (
                <AccordionItem key={i} value={`section-${i}`}>
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <span>{section.name}</span>
                      <Badge variant="secondary" className="ml-2">
                        {section.questions.length} questions
                      </Badge>
                      <Badge variant="outline">
                        {section.totalMarks} marks
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2">
                    <SectionDisplay
                      section={section}
                      prefix={sectionPrefixes[i] || `S${i + 1}`}
                    />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </TabsContent>

          <TabsContent value="answers">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Complete Answer Key</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAllAnswers(!showAllAnswers)}
                >
                  {showAllAnswers ? (
                    <>
                      <EyeOff className="mr-1 h-4 w-4" />
                      Hide All
                    </>
                  ) : (
                    <>
                      <Eye className="mr-1 h-4 w-4" />
                      Show All
                    </>
                  )}
                </Button>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {normalizedPaper.answerKey.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-md border p-2 text-sm"
                  >
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="font-medium">{item.questionNumber}:</span>
                    <span
                      className={
                        showAllAnswers ? '' : 'select-none blur-sm hover:blur-0'
                      }
                    >
                      {item.answer}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
