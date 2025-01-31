import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel,
  AlertDialogAction
} from "@/components/ui/alert-dialog";
import { CalendarIcon } from "lucide-react";
import { format, addMonths, isAfter, isBefore } from 'date-fns';
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface Coupon {
  code: string;
  creator: string;
  timestamp: string;
}

const MAX_COUPONS = 6; // Maximum coupons per page

const CouponGenerator = () => {
  // Group 1 States
  const [numCoupons, setNumCoupons] = useState<number>(1);
  const [creatorName, setCreatorName] = useState<string>('');

  // Group 2 States
  const [websiteUrl, setWebsiteUrl] = useState('www.yourwebsite.com');
  const [websiteError, setWebsiteError] = useState('');
  const [validUntil, setValidUntil] = useState<Date>(addMonths(new Date(), 3));
  const [dateError, setDateError] = useState('');
  const [textColor, setTextColor] = useState('#333333');
  const [validityBoxColor, setValidityBoxColor] = useState('#FFFFFF');
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);

  // Generation States
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [generatedCoupons, setGeneratedCoupons] = useState<Coupon[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const couponsGridRef = useRef<HTMLDivElement>(null);

  const [isImageUploaded, setIsImageUploaded] = useState(false);


  // Load default background on mount
  useEffect(() => {
    fetch('/templates/default-coupon-background-image.png')
      .then(response => response.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onload = () => setBackgroundImage(reader.result as string);
        reader.readAsDataURL(blob);
      })
      .catch(error => console.error('Error loading default background:', error));
  }, []);

  const validateWebsite = (url: string) => {
    if (url.length > 30) {
      setWebsiteError('URL must not exceed 30 characters');
      return false;
    }
    setWebsiteError('');
    return true;
  };

  const validateDate = (selectedDate: Date) => {
    if (isBefore(selectedDate, new Date())) {
      setDateError('Date cannot be in the past');
      return false;
    }
    if (isAfter(selectedDate, addMonths(new Date(), 3))) {
      setDateError('Date cannot be more than 3 months in the future');
      return false;
    }
    setDateError('');
    return true;
  };

  const generateUniqueCode = async (index: number): Promise<string> => {
    const now = Date.now();
    const uniqueTimestamp = now + index;
    const timestampPart = uniqueTimestamp.toString().slice(-4);
    const alphanumericChars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let randomPart = '';
    for (let i = 0; i < 3; i++) {
      randomPart += alphanumericChars.charAt(Math.floor(Math.random() * alphanumericChars.length));
    }
    return `${randomPart}${timestampPart}`;
  };

  const clearGeneratedCoupons = () => {
    setGeneratedCoupons([]);
    setProgress(0);
    toast.success('Ready to generate new coupons');
  };

  const generatePDF = async () => {
    if (!couponsGridRef.current) return;

    try {
      console.log('Starting PDF generation...');

      // Credit card size in mm (standard size: 85.6 × 54 mm)
      const CARD_WIDTH_MM = 85.6;
      const CARD_HEIGHT_MM = 54;
      const A4_WIDTH_MM = 210;
      const A4_HEIGHT_MM = 297;
      const MARGIN_MM = 10;

      console.log('Dimensions (mm):', {
        cardWidth: CARD_WIDTH_MM,
        cardHeight: CARD_HEIGHT_MM,
        pageWidth: A4_WIDTH_MM,
        pageHeight: A4_HEIGHT_MM,
        margin: MARGIN_MM
      });

      // Calculate usable area
      const usableWidth = A4_WIDTH_MM - (2 * MARGIN_MM);
      const usableHeight = A4_HEIGHT_MM - (2 * MARGIN_MM);

      console.log('Usable area (mm):', {
        width: usableWidth,
        height: usableHeight
      });

      // Calculate grid layout
      const DPI = 300;
      const SCALE_FACTOR = DPI / 25.4; // convert mm to pixels
      const cardWidthPx = CARD_WIDTH_MM * SCALE_FACTOR;
      const cardHeightPx = CARD_HEIGHT_MM * SCALE_FACTOR;

      console.log('Pixel dimensions:', {
        cardWidth: cardWidthPx,
        cardHeight: cardHeightPx,
        scaleFactor: SCALE_FACTOR
      });

      console.log('Capturing canvas with html2canvas...');
      const canvas = await html2canvas(couponsGridRef.current, {
        scale: 2,
        width: cardWidthPx * 2, // Two columns
        height: cardHeightPx * 3, // Three rows
        logging: true,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      console.log('Canvas dimensions:', {
        width: canvas.width,
        height: canvas.height
      });

      // Create PDF
      console.log('Creating PDF...');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: false
      });

      console.log('PDF dimensions:', {
        width: pdf.internal.pageSize.getWidth(),
        height: pdf.internal.pageSize.getHeight()
      });

      // Calculate positioning
      const xOffset = (A4_WIDTH_MM - usableWidth) / 2;
      const yOffset = (A4_HEIGHT_MM - usableHeight) / 2;

      console.log('Image positioning:', {
        xOffset,
        yOffset,
        width: usableWidth,
        height: usableHeight
      });

      const imgData = canvas.toDataURL('image/jpeg', 1.0);

      // Add image to PDF
      console.log('Adding image to PDF...');
      pdf.addImage(imgData, 'JPEG',
        xOffset, yOffset,
        usableWidth, usableHeight,
        undefined,
        'FAST');

      // Generate filename and save
      const timestamp = format(new Date(), 'yyyyMMdd-HHmmss');
      const filename = `justpass_${creatorName}_${numCoupons}coupons_${timestamp}.pdf`;

      console.log('Saving PDF with filename:', filename);
      pdf.save(filename);

      console.log('PDF generation complete');
      toast.success('PDF downloaded successfully!');
      setTimeout(clearGeneratedCoupons, 1000);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error generating PDF. Please try again.');
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setBackgroundImage(e.target?.result as string);
        setIsImageUploaded(true);  // Set flag when user uploads
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateClick = () => {
    // Basic validations first
    if (!isImageUploaded) {
      toast.error('Please upload a background image');
      return;
    }
    if (numCoupons > MAX_COUPONS) {
      toast.error(`Maximum ${MAX_COUPONS} coupons allowed per page`);
      return;
    }
    if (!creatorName || !websiteUrl || !validUntil) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (websiteError || dateError) {
      toast.error('Please fix validation errors before generating');
      return;
    }

    // If all validations pass, show confirmation dialog
    setShowConfirmation(true);  // This was missing
  };

  const generateCoupons = async () => {
    try {
      setIsGenerating(true);
      setProgress(0);
      setGeneratedCoupons([]);

      const newCoupons: Coupon[] = [];

      for (let i = 0; i < numCoupons; i++) {
        if (i > 0) {
          for (let p = 0; p < 100; p++) {
            await new Promise(r => setTimeout(r, 50));
            setProgress((i * 100 + p) / numCoupons);
          }
          await new Promise(resolve => setTimeout(resolve, 5000));
        }

        const code = await generateUniqueCode(i);
        const coupon: Coupon = {
          code,
          creator: creatorName,
          timestamp: new Date().toISOString()
        };

        newCoupons.push(coupon);
        setGeneratedCoupons([...newCoupons]);
        setProgress(((i + 1) * 100) / numCoupons);
      }

      setTimeout(() => {
        generatePDF();
      }, 1000);
    } catch (error) {
      console.error('Error generating coupons:', error);
      toast.error('Error generating coupons. Please try again.');
    } finally {
      setIsGenerating(false);
      setShowConfirmation(false);
    }
  };

  const PreviewCard = ({ coupon }: { coupon?: Coupon }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 85.6 54" className="w-full h-full">
      {backgroundImage && (
        <image
          x="0" y="0"
          width="85.6" height="54"
          href={backgroundImage}
          preserveAspectRatio="xMidYMid slice"
        />
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
        {coupon ? `${coupon.code.slice(0, 3)}-${coupon.code.slice(3)}` : 'XXX-1234'}
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
          30 MINUTES
        </text>
        <text
          x="20"
          y="2.8"
          fontFamily="Arial"
          fontSize="1.8"
          textAnchor="middle"
          fill={textColor}
        >
          VALID UNTIL {format(validUntil, 'dd-MMM-yyyy').toUpperCase()}
        </text>
      </g>
    </svg>
  );

  return (
    <div className="relative flex h-full w-full">
      {/* Left Section - Input Forms */}
      <div className="w-[30%] h-full p-4 border-r">
        <Card className="h-full overflow-auto">
          <CardContent className="space-y-6 p-4">
            {/* Group 1 */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="numCoupons">Number of Coupons (Max {MAX_COUPONS})</Label>
                <Input
                  id="numCoupons"
                  type="number"
                  min="1"
                  max={MAX_COUPONS}
                  value={numCoupons}
                  onChange={(e) => {
                    const value = Math.min(parseInt(e.target.value) || 1, MAX_COUPONS);
                    setNumCoupons(value);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="creatorName">Creator Name</Label>
                <Input
                  id="creatorName"
                  value={creatorName}
                  onChange={(e) => setCreatorName(e.target.value)}
                />
              </div>
            </div>

            {/* Group 2 */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Website URL (max 30 characters)</Label>
                <Input
                  value={websiteUrl}
                  onChange={(e) => {
                    const newUrl = e.target.value;
                    setWebsiteUrl(newUrl);
                    validateWebsite(newUrl);
                  }}
                  className={cn(websiteError && "border-red-500")}
                />
                {websiteError && (
                  <p className="text-sm text-red-500">{websiteError}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Valid Until Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !validUntil && "text-muted-foreground",
                        dateError && "border-red-500"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {validUntil ? format(validUntil, 'dd-MMM-yyyy').toUpperCase() : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={validUntil}
                      onSelect={(date) => {
                        if (date) {
                          setValidUntil(date);
                          validateDate(date);
                        }
                      }}
                      disabled={(date) =>
                        isBefore(date, new Date()) || isAfter(date, addMonths(new Date(), 3))
                      }
                    />
                  </PopoverContent>
                </Popover>
                {dateError && (
                  <p className="text-sm text-red-500">{dateError}</p>
                )}
              </div>

              <div className="space-y-2">
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

              <div className="space-y-2">
                <Label>Validity Box Color</Label>
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

              <div className="space-y-2">
                <Label>Background Image</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}  // Use this instead of inline function
                  className="cursor-pointer"
                />
              </div>
            </div>

            <Button
              className="w-full mt-6"
              onClick={handleGenerateClick}
              disabled={isGenerating || !creatorName || !websiteUrl || !validUntil || !isImageUploaded}
            >
              {isGenerating ? 'Generating...' : 'Generate Coupons'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Middle Section - Preview */}
      <div className="w-[35%] h-full p-4 border-r">
        <Card className="h-full flex flex-col">
          <CardContent className="flex-1 p-4">
            <h2 className="text-lg font-semibold mb-4">Preview</h2>
            <div className="flex items-center justify-center h-full">
              <div className="w-full max-w-md aspect-[1.585]">
                <PreviewCard />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Section - Generated Coupons */}
      <div className="w-[35%] h-full p-4">
        <Card className="h-full flex flex-col">
          <CardContent className="flex-1 p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Generated Coupons</h2>
              {isGenerating && (
                <span className="text-sm text-muted-foreground">
                  {generatedCoupons.length} of {numCoupons} generated
                </span>
              )}
            </div>

            {isGenerating && (
              <div className="space-y-2 mb-4">
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-muted-foreground">
                  Please wait. Each coupon takes 5 seconds to ensure unique generation.
                </p>
              </div>
            )}

            {!isGenerating && !generatedCoupons.length && (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No coupons generated yet</p>
              </div>
            )}

            <div
              ref={couponsGridRef}
              className="grid grid-cols-2 gap-8 bg-white rounded border"
              style={{
                width: '190mm', // A4 width minus margins
                padding: '10mm',
                margin: '0 auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 85.6mm)', // Exact credit card width
                gridGap: '10mm',
              }}
            >
              {generatedCoupons.map((coupon) => (
                <div
                  key={coupon.code}
                  style={{
                    width: '85.6mm',
                    height: '54mm', // Exact credit card height
                    border: '2px dashed #e2e2e2',
                    pageBreakInside: 'avoid',
                    breakInside: 'avoid',
                  }}
                >
                  <PreviewCard coupon={coupon} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Coupon Generation</AlertDialogTitle>
            <AlertDialogDescription>
              {numCoupons} coupons × 30 minutes = {numCoupons * 30} minutes will be deducted from your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={generateCoupons}>Agree</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #couponsGrid, #couponsGrid * {
            visibility: visible;
          }
          #couponsGrid {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20mm !important;
          }
          #couponsGrid > div {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
};

export default CouponGenerator;