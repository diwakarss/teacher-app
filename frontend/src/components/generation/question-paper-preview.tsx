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
import type {
  QuestionPaperOutput,
  PaperSection,
  FlexibleQuestion,
} from '@/lib/prompts/question-paper-prompt';
import { QUESTION_TYPE_LABELS } from '@/lib/prompts/question-paper-prompt';
import type { QuestionPaperWithParsed } from '@/services/question-paper-service';

interface QuestionPaperPreviewProps {
  paper: QuestionPaperOutput | QuestionPaperWithParsed;
}

// ── Question renderers by type ──────────────────────────────────────────────

function QuestionDisplay({
  question,
  sectionPrefix,
}: {
  question: FlexibleQuestion;
  sectionPrefix: string;
}) {
  const [showAnswer, setShowAnswer] = useState(false);
  const typeLabel = QUESTION_TYPE_LABELS[question.type] || question.type;

  return (
    <div className="rounded-md border p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-primary">
              {sectionPrefix}{question.number}.
            </span>
            <Badge variant="outline" className="text-xs">
              {question.marks} {question.marks === 1 ? 'mark' : 'marks'}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {typeLabel}
            </Badge>
          </div>

          <p className="mt-1 whitespace-pre-wrap">{question.text}</p>

          {/* Word bank / options */}
          {question.options && question.options.length > 0 && (
            <WordBankOrOptions question={question} />
          )}

          {/* Items (match pairs, classify items) */}
          {question.items && question.items.length > 0 && (
            <ItemsList items={question.items} type={question.type} />
          )}

          {/* Categories for classify */}
          {question.categories && question.categories.length > 0 && (
            <div className="mt-2 flex gap-2 flex-wrap">
              {question.categories.map((cat, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {cat}
                </Badge>
              ))}
            </div>
          )}

          {/* Table display */}
          {question.tableHeaders && question.tableHeaders.length > 0 && (
            <TableDisplay
              headers={question.tableHeaders}
              rows={question.tableRows}
            />
          )}

          {/* Answer lines */}
          {question.answerLines && question.answerLines > 0 && (
            <div className="mt-2 space-y-2">
              {Array.from({ length: question.answerLines }).map((_, i) => (
                <div key={i} className="border-b border-dashed border-gray-300 h-6" />
              ))}
            </div>
          )}

          {/* Answer */}
          {showAnswer && (
            <div className="mt-2 rounded bg-green-50 p-2 text-sm text-green-700">
              <span className="font-medium">Answer: </span>
              {Array.isArray(question.answer)
                ? question.answer.join(', ')
                : question.answer}
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
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

function WordBankOrOptions({ question }: { question: FlexibleQuestion }) {
  const isMcq = question.type === 'mcq';
  const isWordBank =
    question.type === 'fill_blank_word_bank' ||
    question.type === 'complete_paragraph';

  if (isMcq) {
    return (
      <ul className="mt-2 space-y-1 pl-4">
        {question.options!.map((opt, i) => (
          <li key={i} className="text-sm">{opt}</li>
        ))}
      </ul>
    );
  }

  if (isWordBank) {
    return (
      <div className="mt-2 flex flex-wrap gap-2 rounded-md bg-blue-50 p-2">
        <span className="text-xs font-medium text-blue-600 w-full mb-1">Word Bank:</span>
        {question.options!.map((word, i) => (
          <Badge key={i} variant="secondary" className="text-xs">
            {word}
          </Badge>
        ))}
      </div>
    );
  }

  // Generic options display
  return (
    <ul className="mt-2 space-y-1 pl-4">
      {question.options!.map((opt, i) => (
        <li key={i} className="text-sm">{opt}</li>
      ))}
    </ul>
  );
}

function ItemsList({ items, type }: { items: string[]; type: string }) {
  if (type === 'match') {
    return (
      <div className="mt-2 grid grid-cols-2 gap-2 rounded-md border p-2 text-sm">
        <div className="font-medium text-xs text-gray-500 border-b pb-1">Column A</div>
        <div className="font-medium text-xs text-gray-500 border-b pb-1">Column B</div>
        {items.map((item, i) => {
          const parts = item.split(/\s*[-–—]\s*/);
          return (
            <div key={i} className="contents">
              <div className="py-0.5">{parts[0] || item}</div>
              <div className="py-0.5">{parts[1] || ''}</div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <Badge key={i} variant="outline" className="text-xs">
          {item}
        </Badge>
      ))}
    </div>
  );
}

/** Normalize a table row that might be an object, string, or array into string[] */
function normalizeRow(row: unknown, colCount: number): string[] {
  if (Array.isArray(row)) return row.map((c) => (c == null ? '' : String(c)));
  if (row && typeof row === 'object') {
    const values = Object.values(row as Record<string, unknown>);
    return values.map((v) => (v == null ? '' : String(v)));
  }
  if (typeof row === 'string') {
    // Try splitting by common delimiters
    const parts = row.split(/[|,\t]/).map((s) => s.trim());
    if (parts.length >= colCount) return parts;
    return [row, ...Array(Math.max(0, colCount - 1)).fill('')];
  }
  return Array(colCount).fill('');
}

function TableDisplay({
  headers,
  rows,
}: {
  headers: string[];
  rows?: unknown[];
}) {
  const colCount = headers.length;

  return (
    <div className="mt-2 overflow-x-auto">
      <table className="w-full text-sm border-collapse border border-gray-300 rounded">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                className="border border-gray-300 bg-gray-100 px-3 py-1.5 text-left text-xs font-semibold"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        {rows && rows.length > 0 && (
          <tbody>
            {rows.map((rawRow, ri) => {
              const cells = normalizeRow(rawRow, colCount);
              return (
                <tr key={ri}>
                  {cells.map((cell, ci) => (
                    <td
                      key={ci}
                      className="border border-gray-300 px-3 py-1.5 text-xs"
                    >
                      {cell || <span className="text-gray-300">___________</span>}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        )}
      </table>
    </div>
  );
}

// ── Section display ─────────────────────────────────────────────────────────

function SectionDisplay({
  section,
  prefix,
}: {
  section: PaperSection;
  prefix: string;
}) {
  const marksNotation = `[${section.count} x ${section.marksEach} = ${section.totalMarks}]`;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-md bg-muted p-3">
        <div>
          <h4 className="font-medium">{section.name}</h4>
          <p className="text-sm text-muted-foreground">{section.instructions}</p>
        </div>
        <div className="text-right">
          <Badge>{section.totalMarks} marks</Badge>
          <p className="text-xs text-muted-foreground mt-1">{marksNotation}</p>
        </div>
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

// ── Main preview ────────────────────────────────────────────────────────────

export function QuestionPaperPreview({ paper }: QuestionPaperPreviewProps) {
  const [showAllAnswers, setShowAllAnswers] = useState(false);

  // Normalize paper format (handle both new and legacy saved papers)
  const normalizedPaper: QuestionPaperOutput =
    'parsedSections' in paper
      ? {
          name: paper.name,
          header: {
            schoolName: 'Delhi Public School Bangalore East',
            examType: paper.template.toUpperCase(),
            grade: '',
            subject: '',
            duration: `${paper.duration} minutes`,
            maxMarks: paper.totalMarks,
            instructions: [],
          },
          sections: paper.parsedSections,
          answerKey: paper.parsedAnswerKey,
        }
      : paper;

  const sectionPrefixes = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileQuestion className="h-5 w-5 text-primary" />
          {normalizedPaper.name}
        </CardTitle>
        <div className="space-y-1">
          {normalizedPaper.header.schoolName && (
            <p className="text-sm font-medium text-gray-700">
              {normalizedPaper.header.schoolName}
            </p>
          )}
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            {normalizedPaper.header.examType && (
              <Badge variant="outline">{normalizedPaper.header.examType}</Badge>
            )}
            {normalizedPaper.header.grade && (
              <span>{normalizedPaper.header.grade}</span>
            )}
            <span className="flex items-center gap-1">
              <Award className="h-4 w-4" />
              {normalizedPaper.header.maxMarks} marks
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {normalizedPaper.header.duration}
            </span>
          </div>
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
              defaultValue={normalizedPaper.sections.map((_, i) => `section-${i}`)}
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
                      {section.questionType && (
                        <Badge variant="secondary" className="text-xs">
                          {QUESTION_TYPE_LABELS[section.questionType] || section.questionType}
                        </Badge>
                      )}
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
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
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
