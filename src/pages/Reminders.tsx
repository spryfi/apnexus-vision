import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Settings, 
  Calendar as CalendarIcon,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { format, formatDistanceToNow, isPast, isToday, isThisWeek } from "date-fns";

const Reminders = () => {
  const [view, setView] = useState<"list" | "calendar">("list");

  const { data: reminders = [], isLoading } = useQuery({
    queryKey: ["reminders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reminders")
        .select("*")
        .order("reminder_date", { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  const overdueCount = reminders.filter(r => isPast(new Date(r.reminder_date)) && r.status === 'active').length;
  const todayCount = reminders.filter(r => isToday(new Date(r.reminder_date)) && r.status === 'active').length;
  const weekCount = reminders.filter(r => isThisWeek(new Date(r.reminder_date)) && r.status === 'active' && !isToday(new Date(r.reminder_date))).length;
  const upcomingCount = reminders.filter(r => !isThisWeek(new Date(r.reminder_date)) && !isPast(new Date(r.reminder_date)) && r.status === 'active').length;

  const getStatusColor = (reminder: any) => {
    const date = new Date(reminder.reminder_date);
    if (isPast(date) && reminder.status === 'active') return 'border-l-red-500';
    if (isToday(date)) return 'border-l-orange-500';
    if (isThisWeek(date)) return 'border-l-yellow-500';
    return 'border-l-blue-500';
  };

  const getRelativeTime = (date: string) => {
    const reminderDate = new Date(date);
    if (isPast(reminderDate)) {
      return `Overdue by ${formatDistanceToNow(reminderDate)}`;
    }
    return `In ${formatDistanceToNow(reminderDate)}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading reminders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reminders & Notifications</h1>
          <p className="text-muted-foreground mt-1">Stay on top of important dates and deadlines</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Reminder
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Due Today</p>
              <p className="text-2xl font-bold text-orange-600">{todayCount}</p>
            </div>
            <Clock className="h-8 w-8 text-orange-500" />
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Due This Week</p>
              <p className="text-2xl font-bold text-yellow-600">{weekCount}</p>
            </div>
            <CalendarIcon className="h-8 w-8 text-yellow-500" />
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Upcoming</p>
              <p className="text-2xl font-bold text-blue-600">{upcomingCount}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
      </div>

      {/* View Toggle */}
      <Tabs value={view} onValueChange={(v) => setView(v as "list" | "calendar")}>
        <TabsList>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6 mt-6">
          {reminders.length === 0 ? (
            <Card className="p-12 text-center">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">All caught up!</h3>
              <p className="text-muted-foreground mb-4">No pending reminders.</p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Custom Reminder
              </Button>
            </Card>
          ) : (
            <>
              {/* Overdue Section */}
              {overdueCount > 0 && (
                <div className="space-y-3">
                  <h2 className="text-lg font-semibold text-red-600 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Overdue ({overdueCount})
                  </h2>
                  {reminders
                    .filter(r => isPast(new Date(r.reminder_date)) && r.status === 'active')
                    .map(reminder => (
                      <Card key={reminder.id} className={`p-4 border-l-4 ${getStatusColor(reminder)}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{reminder.title}</h3>
                            {reminder.description && (
                              <p className="text-sm text-muted-foreground mt-1">{reminder.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <span className="text-red-600 font-medium">
                                {getRelativeTime(reminder.reminder_date)}
                              </span>
                              <Badge variant="outline">{reminder.reminder_type}</Badge>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">View</Button>
                            <Button size="sm" variant="ghost">
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                </div>
              )}

              {/* Due Today Section */}
              {todayCount > 0 && (
                <div className="space-y-3">
                  <h2 className="text-lg font-semibold text-orange-600 flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Due Today ({todayCount})
                  </h2>
                  {reminders
                    .filter(r => isToday(new Date(r.reminder_date)) && r.status === 'active')
                    .map(reminder => (
                      <Card key={reminder.id} className={`p-4 border-l-4 ${getStatusColor(reminder)}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{reminder.title}</h3>
                            {reminder.description && (
                              <p className="text-sm text-muted-foreground mt-1">{reminder.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <span className="text-orange-600 font-medium">Today</span>
                              <Badge variant="outline">{reminder.reminder_type}</Badge>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">View</Button>
                            <Button size="sm" variant="ghost">
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                </div>
              )}

              {/* Due This Week Section */}
              {weekCount > 0 && (
                <div className="space-y-3">
                  <h2 className="text-lg font-semibold text-yellow-600 flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    Due This Week ({weekCount})
                  </h2>
                  {reminders
                    .filter(r => isThisWeek(new Date(r.reminder_date)) && !isToday(new Date(r.reminder_date)) && r.status === 'active')
                    .map(reminder => (
                      <Card key={reminder.id} className={`p-4 border-l-4 ${getStatusColor(reminder)}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{reminder.title}</h3>
                            {reminder.description && (
                              <p className="text-sm text-muted-foreground mt-1">{reminder.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <span className="text-yellow-600 font-medium">
                                {getRelativeTime(reminder.reminder_date)}
                              </span>
                              <Badge variant="outline">{reminder.reminder_type}</Badge>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">View</Button>
                            <Button size="sm" variant="ghost">
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                </div>
              )}

              {/* Upcoming Section */}
              {upcomingCount > 0 && (
                <div className="space-y-3">
                  <h2 className="text-lg font-semibold text-blue-600 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Upcoming ({upcomingCount})
                  </h2>
                  {reminders
                    .filter(r => !isThisWeek(new Date(r.reminder_date)) && !isPast(new Date(r.reminder_date)) && r.status === 'active')
                    .map(reminder => (
                      <Card key={reminder.id} className={`p-4 border-l-4 ${getStatusColor(reminder)}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{reminder.title}</h3>
                            {reminder.description && (
                              <p className="text-sm text-muted-foreground mt-1">{reminder.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <span className="text-blue-600 font-medium">
                                {format(new Date(reminder.reminder_date), "MMM d, yyyy")}
                              </span>
                              <Badge variant="outline">{reminder.reminder_type}</Badge>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">View</Button>
                            <Button size="sm" variant="ghost">
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <Card className="p-12 text-center">
            <CalendarIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Calendar View</h3>
            <p className="text-muted-foreground">Calendar view coming soon</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reminders;
