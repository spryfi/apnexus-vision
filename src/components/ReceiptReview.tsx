import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AlertCircle, CheckCircle, CalendarIcon, ZoomIn, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ReceiptReviewProps {
  ocrResult: any;
  onAccept: (data: any) => void;
  onReject: () => void;
  vendors?: Array<{ id: string; vendor_name: string }>;
  categories?: Array<{ id: string; category_name: string }>;
}

export const ReceiptReview: React.FC<ReceiptReviewProps> = ({
  ocrResult,
  onAccept,
  onReject,
  vendors = [],
  categories = [],
}) => {
  const { extractedData, validation, qualityScore, qualityBadge, confidenceScores, imageUrl } = ocrResult;
  
  const [formData, setFormData] = useState({
    vendor: extractedData.vendor || '',
    vendorId: '',
    date: extractedData.date ? new Date(extractedData.date) : new Date(),
    amount: extractedData.total || '',
    category: extractedData.category || '',
    categoryId: '',
    description: extractedData.lineItems?.map((item: any) => item.item).join(', ') || '',
  });

  const [showCalendar, setShowCalendar] = useState(false);
  const [editMode, setEditMode] = useState<Record<string, boolean>>({});

  const getConfidenceBadge = (field: string) => {
    const score = confidenceScores[field] || 0;
    if (score >= 90) return <Badge className="bg-green-100 text-green-800">Verified {score}%</Badge>;
    if (score >= 70) return <Badge className="bg-yellow-100 text-yellow-800">Review {score}%</Badge>;
    return <Badge className="bg-red-100 text-red-800">Low {score}%</Badge>;
  };

  const getQualityBadge = () => {
    const badges = {
      excellent: { text: 'Excellent Quality', className: 'bg-green-100 text-green-800' },
      good: { text: 'Good Quality', className: 'bg-lime-100 text-lime-800' },
      fair: { text: 'Fair Quality', className: 'bg-yellow-100 text-yellow-800' },
      poor: { text: 'Poor Quality - Review Required', className: 'bg-red-100 text-red-800' },
    };
    const badge = badges[qualityBadge as keyof typeof badges] || badges.poor;
    return <Badge className={badge.className}>{badge.text}</Badge>;
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAccept = () => {
    onAccept({
      ...formData,
      extractedData,
      confidenceScores,
      qualityScore,
      imageUrl,
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Receipt Image */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Receipt Image</span>
            {getQualityBadge()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative group">
            <img
              src={imageUrl}
              alt="Receipt"
              className="w-full rounded-lg border cursor-zoom-in"
              onClick={() => window.open(imageUrl, '_blank')}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
              <ZoomIn className="w-8 h-8 text-white" />
            </div>
          </div>

          {qualityScore < 70 && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Low confidence extraction - please review all fields carefully
              </AlertDescription>
            </Alert>
          )}

          {validation.warnings.length > 0 && (
            <div className="mt-4 space-y-2">
              {validation.warnings.map((warning, idx) => (
                <Alert key={idx} variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{warning}</AlertDescription>
                </Alert>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Right: Extracted Data Form */}
      <Card>
        <CardHeader>
          <CardTitle>Extracted Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Vendor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Vendor *</Label>
              <div className="flex items-center gap-2">
                {getConfidenceBadge('vendor')}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditMode(prev => ({ ...prev, vendor: !prev.vendor }))}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {editMode.vendor ? (
              <Input
                value={formData.vendor}
                onChange={(e) => handleFieldChange('vendor', e.target.value)}
              />
            ) : (
              <Select
                value={formData.vendorId}
                onValueChange={(value) => handleFieldChange('vendorId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={formData.vendor || 'Select vendor'} />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map(vendor => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.vendor_name}
                    </SelectItem>
                  ))}
                  <SelectItem value="new">+ Add New Vendor</SelectItem>
                </SelectContent>
              </Select>
            )}
            {confidenceScores.vendor < 80 && (
              <p className="text-xs text-yellow-600">Please verify vendor name</p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Date *</Label>
              {getConfidenceBadge('date')}
            </div>
            <Popover open={showCalendar} onOpenChange={setShowCalendar}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !formData.date && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.date ? format(formData.date, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.date}
                  onSelect={(date) => {
                    handleFieldChange('date', date);
                    setShowCalendar(false);
                  }}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            {confidenceScores.date < 80 && (
              <p className="text-xs text-yellow-600">Please verify date</p>
            )}
            {formData.date > new Date() && (
              <p className="text-xs text-red-600">Date cannot be in the future</p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Amount *</Label>
              {getConfidenceBadge('total')}
            </div>
            <Input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => handleFieldChange('amount', e.target.value)}
            />
            {confidenceScores.total < 80 && (
              <p className="text-xs text-yellow-600">Please verify amount</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Category</Label>
              <Badge variant="secondary">Suggested</Badge>
            </div>
            <Select
              value={formData.categoryId}
              onValueChange={(value) => handleFieldChange('categoryId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={formData.category || 'Select category'} />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.category_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              rows={3}
            />
          </div>

          {/* Line Items (Expandable) */}
          {extractedData.lineItems && extractedData.lineItems.length > 0 && (
            <details className="border rounded-lg p-4">
              <summary className="cursor-pointer font-medium">
                Line Items ({extractedData.lineItems.length})
              </summary>
              <div className="mt-2 space-y-1">
                {extractedData.lineItems.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>{item.item}</span>
                    <span>{item.quantity && `${item.quantity}x`} ${item.price}</span>
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button onClick={handleAccept} className="flex-1">
              <CheckCircle className="mr-2 h-4 w-4" />
              Accept & Save
            </Button>
            <Button onClick={onReject} variant="outline">
              Reject & Re-upload
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};