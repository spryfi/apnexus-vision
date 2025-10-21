import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, AlertCircle } from "lucide-react";

interface LineItemsStepProps {
  formData: any;
  setFormData: (data: any) => void;
}

export const LineItemsStep = ({ formData, setFormData }: LineItemsStepProps) => {
  const [newItem, setNewItem] = useState({
    description: '',
    quantity: 1,
    unit_price: 0
  });

  const addLineItem = () => {
    if (!newItem.description || newItem.unit_price <= 0) {
      return;
    }

    setFormData({
      ...formData,
      line_items: [...formData.line_items, newItem]
    });

    setNewItem({
      description: '',
      quantity: 1,
      unit_price: 0
    });
  };

  const removeLineItem = (index: number) => {
    const updatedItems = formData.line_items.filter((_: any, i: number) => i !== index);
    setFormData({ ...formData, line_items: updatedItems });
  };

  const lineItemsTotal = formData.line_items.reduce(
    (sum: number, item: any) => sum + (item.quantity * item.unit_price),
    0
  );

  const costDifference = Math.abs(lineItemsTotal - formData.cost);
  const totalsMatch = costDifference < 0.01;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Service Line Items (Optional)</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Break down the service into individual parts and labor charges
        </p>
      </div>

      {/* Existing Line Items */}
      {formData.line_items.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-3 font-semibold">Description</th>
                <th className="text-right p-3 font-semibold">Qty</th>
                <th className="text-right p-3 font-semibold">Unit Price</th>
                <th className="text-right p-3 font-semibold">Total</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {formData.line_items.map((item: any, index: number) => (
                <tr key={index} className="border-t">
                  <td className="p-3">{item.description}</td>
                  <td className="p-3 text-right">{item.quantity}</td>
                  <td className="p-3 text-right">${item.unit_price.toFixed(2)}</td>
                  <td className="p-3 text-right font-semibold">
                    ${(item.quantity * item.unit_price).toFixed(2)}
                  </td>
                  <td className="p-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLineItem(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 bg-gray-50">
                <td colSpan={3} className="p-3 text-right font-semibold">
                  Line Items Total:
                </td>
                <td className="p-3 text-right font-bold text-lg">
                  ${lineItemsTotal.toFixed(2)}
                </td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Total Validation */}
      {formData.line_items.length > 0 && (
        <div className={`p-4 rounded-lg border ${totalsMatch ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <div className="flex items-start gap-2">
            <AlertCircle className={`h-5 w-5 mt-0.5 ${totalsMatch ? 'text-green-600' : 'text-yellow-600'}`} />
            <div>
              <p className={`font-semibold ${totalsMatch ? 'text-green-900' : 'text-yellow-900'}`}>
                {totalsMatch ? 'Totals Match ✓' : 'Totals Do Not Match'}
              </p>
              <p className={`text-sm ${totalsMatch ? 'text-green-700' : 'text-yellow-700'}`}>
                Service Cost: ${formData.cost.toFixed(2)} | Line Items: ${lineItemsTotal.toFixed(2)}
                {!totalsMatch && ` | Difference: $${costDifference.toFixed(2)}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add New Line Item Form */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <h4 className="font-semibold mb-3">Add Line Item</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <Label htmlFor="item_description">Description</Label>
            <Input
              id="item_description"
              placeholder="e.g., Labor, Oil filter, Brake pads"
              value={newItem.description}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="item_quantity">Quantity</Label>
            <Input
              id="item_quantity"
              type="number"
              min="1"
              value={newItem.quantity}
              onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
            />
          </div>
          <div>
            <Label htmlFor="item_price">Unit Price</Label>
            <Input
              id="item_price"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={newItem.unit_price || ''}
              onChange={(e) => setNewItem({ ...newItem, unit_price: parseFloat(e.target.value) || 0 })}
            />
          </div>
        </div>
        <Button
          onClick={addLineItem}
          variant="outline"
          size="sm"
          className="mt-3"
          disabled={!newItem.description || newItem.unit_price <= 0}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      {formData.line_items.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">
            No line items added yet. You can skip this step if you don't need detailed breakdown.
          </p>
        </div>
      )}
    </div>
  );
};
