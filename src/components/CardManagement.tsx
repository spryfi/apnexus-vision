import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CreditCard, Plus, Edit2, Trash2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";

interface CompanyCard {
  id: string;
  card_type: string;
  card_brand: string;
  first_four: string;
  last_four: string;
  cardholder_name: string;
  assigned_to: string | null;
  driver_number: string | null;
  is_active: boolean;
  notes: string | null;
}

interface Employee {
  id: string;
  employee_name: string;
}

const CardManagement = () => {
  const [cards, setCards] = useState<CompanyCard[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CompanyCard | null>(null);
  const isMobile = useIsMobile();
  const [formData, setFormData] = useState({
    card_type: '',
    card_brand: '',
    first_four: '',
    last_four: '',
    cardholder_name: '',
    assigned_to: '',
    driver_number: '',
    notes: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCards();
    fetchEmployees();
  }, []);

  const fetchCards = async () => {
    try {
      const { data, error } = await supabase
        .from('company_cards')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCards(data || []);
    } catch (error) {
      console.error('Error fetching cards:', error);
      toast({
        title: "Error loading cards",
        description: "Could not load company cards",
        variant: "destructive",
      });
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, employee_name')
        .order('employee_name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const cardData = {
        card_type: formData.card_type,
        card_brand: formData.card_brand,
        first_four: formData.first_four,
        last_four: formData.last_four,
        cardholder_name: formData.cardholder_name,
        assigned_to: formData.assigned_to || null,
        driver_number: formData.driver_number || null,
        notes: formData.notes || null,
      };

      if (editingCard) {
        const { error } = await supabase
          .from('company_cards')
          .update(cardData)
          .eq('id', editingCard.id);

        if (error) throw error;
        
        toast({
          title: "Card updated",
          description: "Company card has been updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('company_cards')
          .insert([cardData]);

        if (error) throw error;
        
        toast({
          title: "Card added",
          description: "New company card has been added successfully",
        });
      }

      setIsDialogOpen(false);
      setEditingCard(null);
      resetForm();
      fetchCards();
    } catch (error) {
      console.error('Error saving card:', error);
      toast({
        title: "Error saving card",
        description: "Could not save the card information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      card_type: '',
      card_brand: '',
      first_four: '',
      last_four: '',
      cardholder_name: '',
      assigned_to: '',
      driver_number: '',
      notes: ''
    });
  };

  const handleEdit = (card: CompanyCard) => {
    setEditingCard(card);
    setFormData({
      card_type: card.card_type,
      card_brand: card.card_brand,
      first_four: card.first_four,
      last_four: card.last_four,
      cardholder_name: card.cardholder_name,
      assigned_to: card.assigned_to || '',
      driver_number: card.driver_number || '',
      notes: card.notes || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (cardId: string) => {
    if (!confirm('Are you sure you want to delete this card?')) return;

    try {
      const { error } = await supabase
        .from('company_cards')
        .update({ is_active: false })
        .eq('id', cardId);

      if (error) throw error;

      toast({
        title: "Card deactivated",
        description: "Card has been deactivated successfully",
      });

      fetchCards();
    } catch (error) {
      console.error('Error deactivating card:', error);
      toast({
        title: "Error deactivating card",
        description: "Could not deactivate the card",
        variant: "destructive",
      });
    }
  };

  const getCardTypeColor = (type: string) => {
    switch (type) {
      case 'credit': return 'bg-blue-100 text-blue-800';
      case 'debit': return 'bg-green-100 text-green-800';
      case 'fuel': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEmployeeName = (employeeId: string | null) => {
    if (!employeeId) return 'Unassigned';
    const employee = employees.find(emp => emp.id === employeeId);
    return employee?.employee_name || 'Unknown Employee';
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-muted rounded"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className={`flex ${isMobile ? 'flex-col gap-3' : 'items-center justify-between'}`}>
        <h3 className={`font-semibold flex items-center gap-2 ${isMobile ? 'text-sm' : ''}`}>
          <CreditCard className="h-4 w-4" />
          Company Cards Management
        </h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => { setEditingCard(null); resetForm(); }}
              size={isMobile ? "sm" : "default"}
              className={isMobile ? "w-full" : ""}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Card
            </Button>
          </DialogTrigger>
          <DialogContent className={isMobile ? "w-[95vw] max-w-none" : ""}>
            <DialogHeader>
              <DialogTitle className={isMobile ? "text-base" : ""}>
                {editingCard ? 'Edit Company Card' : 'Add New Company Card'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                <div>
                  <Label htmlFor="card_type">Card Type</Label>
                  <Select 
                    value={formData.card_type} 
                    onValueChange={(value) => setFormData({...formData, card_type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-background">
                      <SelectItem value="credit">Credit Card</SelectItem>
                      <SelectItem value="debit">Debit Card</SelectItem>
                      <SelectItem value="fuel">Fuel Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="card_brand">Card Brand</Label>
                  <Input
                    id="card_brand"
                    value={formData.card_brand}
                    onChange={(e) => setFormData({...formData, card_brand: e.target.value})}
                    placeholder="Visa, Mastercard, Amex..."
                    required
                  />
                </div>
              </div>
                
              <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                <div>
                  <Label htmlFor="first_four">First 4 Digits</Label>
                  <Input
                    id="first_four"
                    value={formData.first_four}
                    onChange={(e) => setFormData({...formData, first_four: e.target.value.replace(/\D/g, '').slice(0, 4)})}
                    placeholder="1234"
                    maxLength={4}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="last_four">Last 4 Digits</Label>
                  <Input
                    id="last_four"
                    value={formData.last_four}
                    onChange={(e) => setFormData({...formData, last_four: e.target.value.replace(/\D/g, '').slice(0, 4)})}
                    placeholder="5678"
                    maxLength={4}
                    required
                  />
                </div>
              </div>

                <div>
                  <Label htmlFor="cardholder_name">Cardholder Name</Label>
                  <Input
                    id="cardholder_name"
                    value={formData.cardholder_name}
                    onChange={(e) => setFormData({...formData, cardholder_name: e.target.value})}
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="assigned_to">Assigned To</Label>
                  <Select 
                    value={formData.assigned_to} 
                    onValueChange={(value) => setFormData({...formData, assigned_to: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-background">
                      <SelectItem value="">Unassigned</SelectItem>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.employee_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.card_type === 'fuel' && (
                  <div>
                    <Label htmlFor="driver_number">Driver Number</Label>
                    <Input
                      id="driver_number"
                      value={formData.driver_number}
                      onChange={(e) => setFormData({...formData, driver_number: e.target.value})}
                      placeholder="Driver ID or number"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Additional notes..."
                  />
                </div>

                <div className={`flex gap-2 ${isMobile ? 'flex-col' : 'justify-end'}`}>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingCard ? 'Update Card' : 'Add Card'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      <div className="space-y-3">
        {cards.filter(card => card.is_active).map((card) => (
          <div key={card.id} className={`flex ${isMobile ? 'flex-col gap-3' : 'items-center justify-between'} p-3 border rounded-lg`}>
            <div className="flex items-center gap-3">
              <CreditCard className={`text-muted-foreground ${isMobile ? 'h-6 w-6' : 'h-8 w-8'}`} />
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-medium ${isMobile ? 'text-sm' : ''}`}>
                    {card.card_brand} •••• {card.last_four}
                  </span>
                  <Badge className={`${getCardTypeColor(card.card_type)} ${isMobile ? 'text-xs' : ''}`}>
                    {card.card_type}
                  </Badge>
                </div>
                <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  {card.cardholder_name} • {getEmployeeName(card.assigned_to)}
                </p>
                {card.driver_number && (
                  <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-xs'}`}>
                    Driver: {card.driver_number}
                  </p>
                )}
              </div>
            </div>
            <div className={`flex gap-2 ${isMobile ? 'w-full' : ''}`}>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleEdit(card)}
                className={isMobile ? "flex-1" : ""}
              >
                <Edit2 className="h-4 w-4" />
                {isMobile && <span className="ml-2">Edit</span>}
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleDelete(card.id)}
                className={isMobile ? "flex-1" : ""}
              >
                <Trash2 className="h-4 w-4" />
                {isMobile && <span className="ml-2">Delete</span>}
              </Button>
            </div>
          </div>
        ))}
        
        {cards.filter(card => card.is_active).length === 0 && (
          <div className={`text-center py-8 text-muted-foreground ${isMobile ? 'text-sm py-6' : ''}`}>
            No company cards found. Click "Add Card" to get started.
          </div>
        )}
      </div>
    </div>
  );
};

export default CardManagement;