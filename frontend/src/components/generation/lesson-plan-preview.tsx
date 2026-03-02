'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Clock,
  Target,
  BookOpen,
  Activity,
  CheckCircle,
  Users,
  Pencil,
  Save,
  X,
  Package,
} from 'lucide-react';
import type { LessonPlanOutput } from '@/lib/prompts/lesson-plan-prompt';
import type { LessonPlanWithParsed } from '@/services/lesson-plan-service';

interface LessonPlanPreviewProps {
  plan: LessonPlanOutput | LessonPlanWithParsed;
  editable?: boolean;
  onSave?: (plan: LessonPlanOutput) => void;
  onCancel?: () => void;
}

export function LessonPlanPreview({
  plan,
  editable = false,
  onSave,
  onCancel,
}: LessonPlanPreviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedPlan, setEditedPlan] = useState<LessonPlanOutput | null>(null);

  // Normalize plan format
  const normalizedPlan: LessonPlanOutput = 'parsedSections' in plan
    ? {
        name: plan.name,
        objectives: plan.parsedObjectives,
        sections: plan.parsedSections,
        materials: plan.parsedMaterials,
      }
    : plan;

  const currentPlan = editedPlan || normalizedPlan;

  const startEditing = () => {
    setEditedPlan({ ...normalizedPlan });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setEditedPlan(null);
    setIsEditing(false);
    onCancel?.();
  };

  const handleSave = () => {
    if (editedPlan && onSave) {
      onSave(editedPlan);
    }
    setIsEditing(false);
    setEditedPlan(null);
  };

  const updateName = (name: string) => {
    if (editedPlan) {
      setEditedPlan({ ...editedPlan, name });
    }
  };

  const updateObjective = (index: number, value: string) => {
    if (editedPlan) {
      const objectives = [...editedPlan.objectives];
      objectives[index] = value;
      setEditedPlan({ ...editedPlan, objectives });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          {isEditing ? (
            <Input
              value={currentPlan.name}
              onChange={(e) => updateName(e.target.value)}
              className="max-w-md"
            />
          ) : (
            currentPlan.name
          )}
        </CardTitle>
        {editable && (
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" size="sm" onClick={cancelEditing}>
                  <X className="mr-1 h-4 w-4" />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave}>
                  <Save className="mr-1 h-4 w-4" />
                  Save
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={startEditing}>
                <Pencil className="mr-1 h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Objectives */}
        <div>
          <h3 className="mb-3 flex items-center gap-2 font-semibold">
            <Target className="h-4 w-4 text-primary" />
            Learning Objectives
          </h3>
          <ul className="space-y-2">
            {currentPlan.objectives.map((obj, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                {isEditing ? (
                  <Input
                    value={obj}
                    onChange={(e) => updateObjective(i, e.target.value)}
                    className="flex-1"
                  />
                ) : (
                  <span>{obj}</span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Sections */}
        <Accordion
          type="multiple"
          defaultValue={['introduction', 'mainContent', 'activities', 'assessment']}
          className="w-full"
        >
          {/* Introduction */}
          <AccordionItem value="introduction">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-blue-500" />
                Introduction
                <Badge variant="secondary" className="ml-2">
                  <Clock className="mr-1 h-3 w-3" />
                  {currentPlan.sections.introduction.duration} min
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  Content
                </h4>
                {isEditing ? (
                  <Textarea
                    value={currentPlan.sections.introduction.content}
                    onChange={(e) => {
                      if (editedPlan) {
                        setEditedPlan({
                          ...editedPlan,
                          sections: {
                            ...editedPlan.sections,
                            introduction: {
                              ...editedPlan.sections.introduction,
                              content: e.target.value,
                            },
                          },
                        });
                      }
                    }}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1">{currentPlan.sections.introduction.content}</p>
                )}
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  Hook
                </h4>
                {isEditing ? (
                  <Textarea
                    value={currentPlan.sections.introduction.hook}
                    onChange={(e) => {
                      if (editedPlan) {
                        setEditedPlan({
                          ...editedPlan,
                          sections: {
                            ...editedPlan.sections,
                            introduction: {
                              ...editedPlan.sections.introduction,
                              hook: e.target.value,
                            },
                          },
                        });
                      }
                    }}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 rounded-md bg-blue-50 p-3 text-blue-700">
                    {currentPlan.sections.introduction.hook}
                  </p>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Main Content */}
          <AccordionItem value="mainContent">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-purple-500" />
                Main Content
                <Badge variant="secondary" className="ml-2">
                  <Clock className="mr-1 h-3 w-3" />
                  {currentPlan.sections.mainContent.duration} min
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  Topics
                </h4>
                <ul className="mt-1 list-inside list-disc space-y-1">
                  {currentPlan.sections.mainContent.topics.map((topic, i) => (
                    <li key={i}>{topic}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  Teaching Strategies
                </h4>
                <ul className="mt-1 list-inside list-disc space-y-1">
                  {currentPlan.sections.mainContent.teachingStrategies.map(
                    (strategy, i) => (
                      <li key={i}>{strategy}</li>
                    )
                  )}
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Activities */}
          <AccordionItem value="activities">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-orange-500" />
                Activities
                <Badge variant="secondary" className="ml-2">
                  <Clock className="mr-1 h-3 w-3" />
                  {currentPlan.sections.activities.duration} min
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
              {currentPlan.sections.activities.activities.map((activity, i) => (
                <div
                  key={i}
                  className="rounded-md border bg-card p-3"
                >
                  <h4 className="font-medium">{activity.name}</h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {activity.description}
                  </p>
                  {activity.materials && activity.materials.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {activity.materials.map((material, j) => (
                        <Badge key={j} variant="outline" className="text-xs">
                          {material}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>

          {/* Assessment */}
          <AccordionItem value="assessment">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Assessment
                <Badge variant="secondary" className="ml-2">
                  <Clock className="mr-1 h-3 w-3" />
                  {currentPlan.sections.assessment.duration} min
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  Methods
                </h4>
                <ul className="mt-1 list-inside list-disc space-y-1">
                  {currentPlan.sections.assessment.methods.map((method, i) => (
                    <li key={i}>{method}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  Questions
                </h4>
                <ol className="mt-1 list-inside list-decimal space-y-1">
                  {currentPlan.sections.assessment.questions.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ol>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Differentiation */}
          <AccordionItem value="differentiation">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-teal-500" />
                Differentiation
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
              <div>
                <h4 className="text-sm font-medium text-green-600">
                  For Advanced Students
                </h4>
                <ul className="mt-1 list-inside list-disc space-y-1">
                  {currentPlan.sections.differentiation.advanced.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium text-amber-600">
                  For Struggling Students
                </h4>
                <ul className="mt-1 list-inside list-disc space-y-1">
                  {currentPlan.sections.differentiation.struggling.map(
                    (item, i) => (
                      <li key={i}>{item}</li>
                    )
                  )}
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Materials */}
        {currentPlan.materials && currentPlan.materials.length > 0 && (
          <div>
            <h3 className="mb-3 flex items-center gap-2 font-semibold">
              <Package className="h-4 w-4 text-primary" />
              Materials Needed
            </h3>
            <div className="flex flex-wrap gap-2">
              {currentPlan.materials.map((material, i) => (
                <Badge key={i} variant="secondary">
                  {material}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
