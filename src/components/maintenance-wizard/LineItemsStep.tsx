import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import { MaintenanceFormData } from "../AddMaintenanceWizard";

interface LineItemsStepProps {
  formData: MaintenanceFormData;
  setFormData: (data: MaintenanceFormData) => void;
}

export const LineItemsStep = ({ formData, setFormData }: LineItemsStepProps) => {
  const [newItem, setNewItem] = useState({
    description: '',
    part_number: '',
    quantity: 1,
    unit_price: 0
  });

  const addLineItem = () => {
    if (!newItem.description || newItem.unit_price <= 0) {
      return;
    }

    const total_price = newItem.quantity * newItem.unit_price;

    setFormData({
      ...formData,
      line_items: [
        ...formData.line_items,
        {
          ...newItem,
          total_price
        }
      ]
    });

    setNewItem({
      description: '',
      part_number: '',
      quantity: 1,
      unit_price: 0
    });
  };

  const removeLineItem = (index: number) => {
    setFormData({
      ...formData,
      line_items: formData.line_items.filter((_, i) => i !== index)
    });
  };

  const lineItemsTotal = formData.line_items.reduce((sum, item) => sum + item.total_price, 0);
  const costDifference = Math.abs(lineItemsTotal - formData.cost);
  const totalsMatch = costDifference < 0.01;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Service Line Items</h3>
        <p className="text-sm text-muted-foreground">
          Optional - Break down the service into individual parts and labor
        </p>
      </div>

      {/* Existing Line Items */}
      {formData.line_items.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium">Current Line Items</h4>
          {formData.line_items.map((item, index) => (
            <Card key={index} className="p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 grid grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="font-medium">{item.description}</p>
                    {item.part_number && (
                      <p className="text-xs text-muted-foreground">Part: {item.part_number}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground">Qty</p>
                    <p className="font-medium">{item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground">Unit Price</p>
                    <p className="font-medium">${item.unit_price.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground">Total</p>
                    <p className="font-semibold">${item.total_price.toFixed(2)}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeLineItem(index)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </Card>
          ))}

          <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
            <span className="font-semibold">Line Items Total:</span>
            <span className="text-lg font-bold">${lineItemsTotal.toFixed(2)}</span>
          </div>

          {!totalsMatch && formData.line_items.length > 0 && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800">Total Mismatch</p>
                <p className="text-xs text-yellow-700">
                  Line items total (${lineItemsTotal.toFixed(2)}) doesn't match service cost (${formData.cost.toFixed(2)})
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add New Line Item */}
      <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
        <h4 className="font-medium">Add Line Item</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="item_description">Description *</Label>
            <Input
              id="item_description"
              value={newItem.description}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              placeholder="Labor, parts, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="part_number">Part Number</Label>
            <Input
              id="part_number"
              value={newItem.part_number}
              onChange={(e) => setNewItem({ ...newItem, part_number: e.target.value })}
              placeholder="Optional"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              step="1"
              value={newItem.quantity}
              onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit_price">Unit Price *</Label>
            <Input
              id="unit_price"
              type="number"
              min="0"
              step="0.01"
              value={newItem.unit_price || ''}
              onChange={(e) => setNewItem({ ...newItem, unit_price: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            {newItem.description && newItem.unit_price > 0 ? (
              <>Total: ${(newItem.quantity * newItem.unit_price).toFixed(2)}</>
            ) : (
              'Fill in details to add line item'
            )}
          </p>
          <Button
            onClick={addLineItem}
            disabled={!newItem.description || newItem.unit_price <= 0}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Line items are optional but help with detailed record keeping. 
          If you skip this step, only the total cost will be recorded.
        </p>
      </div>
    </div>
  );
};
