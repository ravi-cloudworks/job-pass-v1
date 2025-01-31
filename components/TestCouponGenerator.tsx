import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, addMonths, isAfter, isBefore } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const CouponGenerator = () => {
  const [websiteUrl, setWebsiteUrl] = useState('www.yourwebsite.com');
  const [websiteError, setWebsiteError] = useState('');
  const [couponCode, setCouponCode] = useState('WA1-X2B4');
  const [timeLimit, setTimeLimit] = useState('30');
  const [customText, setCustomText] = useState('MINUTES');
  const [date, setDate] = useState<Date>(addMonths(new Date(), 3));
  const [dateError, setDateError] = useState('');
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [textColor, setTextColor] = useState('#333333');
  const [validityBoxColor, setValidityBoxColor] = useState('#FFFFFF');

  // Format date for display
  const formattedDate = date ? format(date, 'dd-MMM-yyyy').toUpperCase() : '';

  // Calculate date limits
  const maxDate = addMonths(new Date(), 3);
  const minDate = new Date();

  // Validate website URL
  const validateWebsite = (url: string) => {
    if (url.length > 30) {
      setWebsiteError('URL must not exceed 30 characters');
      return false;
    }
    setWebsiteError('');
    return true;
  };

  // Validate date
  const validateDate = (selectedDate: Date) => {
    if (isBefore(selectedDate, minDate)) {
      setDateError('Date cannot be in the past');
      return false;
    }
    if (isAfter(selectedDate, maxDate)) {
      setDateError('Date cannot be more than 3 months in the future');
      return false;
    }
    setDateError('');
    return true;
  };

  const handleWebsiteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setWebsiteUrl(newUrl);
    validateWebsite(newUrl);
  };

  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      setDate(newDate);
      validateDate(newDate);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setBackgroundImage(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const downloadAsPNG = () => {
    if (!validateWebsite(websiteUrl) || !validateDate(date)) {
      return;
    }

    const svg = document.querySelector('svg');
    if (!svg) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 856;
    canvas.height = 540;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const URL = window.URL || window.webkitURL || window;
    const svgUrl = URL.createObjectURL(svgBlob);
    
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      const link = document.createElement('a');
      link.download = 'coupon.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      URL.revokeObjectURL(svgUrl);
    };
    
    img.src = svgUrl;
  };

  const PreviewCard = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 85.6 54" className="w-full h-full">
      {backgroundImage ? (
        <image
          x="0" y="0"
          width="85.6" height="54"
          href={backgroundImage}
          preserveAspectRatio="xMidYMid slice"
        />
      ) : (
        <rect x="0" y="0" width="85.6" height="54" fill="#e0e0e0"/>
      )}

      <text 
        x="56.8" y="31" 
        fontFamily="Arial" 
        fontSize="3" 
        fill={textColor}
        textAnchor="middle"
      >
        {websiteUrl}/jobpass
      </text>

      <text 
        x="57" y="40" 
        fontFamily="Arial Black" 
        fontSize="7" 
        fontWeight="500" 
        fill={textColor}
        letterSpacing="1"
        textAnchor="middle"
      >
        {couponCode}
      </text>

      <g transform="translate(42.8, 45)">
        <rect 
          x="4" y="-2.5" 
          width="32" height="6" 
          fill={validityBoxColor}
          rx="3" 
          ry="3"
          stroke={textColor}
          strokeWidth="0.5"
        />
        <text 
          x="20"
          y="0.5" 
          fontFamily="Arial" 
          fontSize="2.8" 
          textAnchor="middle" 
          fill={textColor}
          fontWeight="bold"
        >
          {timeLimit} {customText}
        </text>
        <text 
          x="20"
          y="2.8" 
          fontFamily="Arial" 
          fontSize="1.8" 
          textAnchor="middle" 
          fill={textColor}
        >
          VALID UNTIL {formattedDate}
        </text>
      </g>
    </svg>
  );

  return (
    <Card className="w-full max-w-4xl p-6">
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <Label>Website URL (up to 30 characters)</Label>
              <Input 
                value={websiteUrl} 
                onChange={handleWebsiteChange}
                className={cn(websiteError && "border-red-500")}
              />
              {websiteError && (
                <p className="text-sm text-red-500 mt-1">{websiteError}</p>
              )}
            </div>

            <div>
              <Label>Coupon Code (up to 8 characters)</Label>
              <Input 
                value={couponCode} 
                onChange={(e) => setCouponCode(e.target.value)} 
                maxLength={8}
              />
            </div>

            <div>
              <Label>Valid Until Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground",
                      dateError && "border-red-500"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formattedDate}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={handleDateSelect}
                    disabled={(date) =>
                      isBefore(date, minDate) || isAfter(date, maxDate)
                    }
                  />
                </PopoverContent>
              </Popover>
              {dateError && (
                <p className="text-sm text-red-500 mt-1">{dateError}</p>
              )}
            </div>

            <div>
              <Label>Text Color</Label>
              <div className="flex gap-4 items-center">
                <Input 
                  type="color" 
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-20 h-10 p-1 cursor-pointer"
                />
                <span className="text-sm text-gray-500">{textColor}</span>
              </div>
            </div>

            <div>
              <Label>Validity Box Background</Label>
              <div className="flex gap-4 items-center">
                <Input 
                  type="color" 
                  value={validityBoxColor}
                  onChange={(e) => setValidityBoxColor(e.target.value)}
                  className="w-20 h-10 p-1 cursor-pointer"
                />
                <span className="text-sm text-gray-500">{validityBoxColor}</span>
              </div>
            </div>

            <div>
              <Label>Upload Design</Label>
              <Input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload}
                className="cursor-pointer"
              />
            </div>

            <Button 
              onClick={downloadAsPNG} 
              className="w-full"
              disabled={!!websiteError || !!dateError}
            >
              Download as PNG
            </Button>
          </div>

          <div className="bg-white">
            <div className="w-full aspect-[1.585]">
              {backgroundImage ? <PreviewCard /> : (
                <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                  <p className="text-gray-400">Upload an image to see preview</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CouponGenerator;