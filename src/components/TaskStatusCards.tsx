import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, X, Clock } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths } from "date-fns";

interface TaskCompletion {
  id: string;
  task_template_id: string;
  status: string;
  task_templates: {
    name: string;
    task_type: string;
    category: string;
  };
}

export default function TaskStatusCards() {
  const [weeklyTasks, setWeeklyTasks] = useState<TaskCompletion[]>([]);
  const [monthlyTasks, setMonthlyTasks] = useState<TaskCompletion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTaskStatus();
  }, []);

  const fetchTaskStatus = async () => {
    try {
      const now = new Date();
      const currentWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 0 });
      const currentWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 0 });
      const currentMonthStart = startOfMonth(subMonths(now, 1));
      const currentMonthEnd = endOfMonth(subMonths(now, 1));

      // Fetch weekly tasks
      const { data: weeklyData } = await supabase
        .from('task_completions')
        .select(`
          *,
          task_templates (*)
        `)
        .eq('task_templates.task_type', 'weekly')
        .gte('period_start', format(currentWeekStart, 'yyyy-MM-dd'))
        .lte('period_end', format(currentWeekEnd, 'yyyy-MM-dd'));

      // Fetch monthly tasks
      const { data: monthlyData } = await supabase
        .from('task_completions')
        .select(`
          *,
          task_templates (*)
        `)
        .eq('task_templates.task_type', 'monthly')
        .gte('period_start', format(currentMonthStart, 'yyyy-MM-dd'))
        .lte('period_end', format(currentMonthEnd, 'yyyy-MM-dd'));

      setWeeklyTasks(weeklyData || []);
      setMonthlyTasks(monthlyData || []);
    } catch (error) {
      console.error('Error fetching task status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTaskStatus = (tasks: TaskCompletion[] = [], category: string) => {
    // Defensive: task_templates may be null when the join didn't return a row
    const task = tasks.find((t) => t.task_templates && t.task_templates.category === category);
    return task?.status || 'pending';
  };

  const TaskCard = ({ 
    title, 
    status, 
    type, 
    className = "" 
  }: { 
    title: string; 
    status: string; 
    type: 'weekly' | 'monthly';
    className?: string;
  }) => {
    const isCompleted = status === 'completed' || status === 'validated';
    
    return (
      <Card className={`mb-3 shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105 ${className}`}>
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <Badge variant={type === 'weekly' ? 'default' : 'secondary'} className="text-xs">
              {type === 'weekly' ? 'Weekly' : 'Monthly'}
            </Badge>
            <div className="flex items-center">
              {isCompleted ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : status === 'in_progress' ? (
                <Clock className="h-4 w-4 text-orange-500" />
              ) : (
                <X className="h-4 w-4 text-red-500" />
              )}
            </div>
          </div>
          <div className="text-sm font-medium text-foreground">{title}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {isCompleted ? 'Completed' : status === 'in_progress' ? 'In Progress' : 'Not Done'}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-muted rounded-lg animate-pulse"></div>
        ))}
      </div>
    );
  }

  const payrollStatus = getTaskStatus(weeklyTasks, 'payroll');
  const fuelStatus = getTaskStatus(monthlyTasks, 'fuel');
  const creditCardStatus = getTaskStatus(monthlyTasks, 'credit_card');

  return (
    <div className="space-y-2">
      <TaskCard
        title="Payroll"
        status={payrollStatus}
        type="weekly"
      />
      <TaskCard
        title="Fuel Tracking"
        status={fuelStatus}
        type="monthly"
      />
      <TaskCard
        title="Credit Card Reconcile"
        status={creditCardStatus}
        type="monthly"
      />
    </div>
  );
}