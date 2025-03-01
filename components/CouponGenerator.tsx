import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import ReactDOM from 'react-dom';
import { Root, createRoot } from 'react-dom/client';
import confetti from 'canvas-confetti';

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

  // Add state for dialog
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [downloadedFile, setDownloadedFile] = useState('');

  const dialogShownRef = useRef(false);

  const [pdfState, setPdfState] = useState<{
    filename: string;
    showDialog: boolean;
  }>({
    filename: '',
    showDialog: false
  });

  // Load default background on mount
  useEffect(() => {
    fetch('./templates/default-coupon-background-image.png')
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
      setWebsiteError('URL must not exceed 30 characters.');
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

  const generateUniqueCode = async (index: number) => {
    try {
      const now = Date.now();
      const uniqueTimestamp = now + index;
      const timestampPart = uniqueTimestamp.toString().slice(-4);
      const alphanumericChars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
      let randomPart = '';
      for (let i = 0; i < 3; i++) {
        randomPart += alphanumericChars.charAt(Math.floor(Math.random() * alphanumericChars.length));
      }
      return `${randomPart}${timestampPart}`;
    } catch (error) {
      setGeneratedCoupons([]); // Clear on error
      throw error;
    }
  };

  const DownloadConfirmation = React.memo<{
    filename: string;
    isOpen: boolean;
    onClose: () => void;
  }>(({ filename, isOpen, onClose }) => {
    return (
      <AlertDialog open={isOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold">
              PDF Generated Successfully!
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <div className="text-center mb-3">
                  <p className="text-sm mb-1">Your PDF has been downloaded as:</p>
                  <p className="text-base font-semibold text-primary">{filename}</p>
                </div>
                <p className="text-sm">Please check your downloads folder.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={onClose}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  });

  const clearGeneratedCoupons = () => {
    setGeneratedCoupons([]);
    setProgress(0);
    toast.success('Ready to generate new coupons');
  };

  const generatePDF = async (coupons: Coupon[]) => {
    try {
      const CARD_WIDTH = 85.6;
      const CARD_HEIGHT = 54;
      const pdf = new jsPDF({
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait',
      });

      // Set PDF metadata
      pdf.setProperties({
        title: 'JobPass Coupons',
        subject: 'Interview Success Cards',
        author: 'www.jobpass.com',
        creator: 'www.jobpass.com',
      });

      // Add header
      pdf.setFontSize(10);
      pdf.setTextColor(100);
      const topMargin = 10;
      const leftMargin = 10;
      pdf.text('Generated by www.ravi.cloudworks.org', leftMargin, topMargin);
      pdf.text(`Created: ${format(new Date(), 'dd-MMM-yyyy HH:mm:ss OOOO')}`, leftMargin, topMargin + 5);
      pdf.line(leftMargin, topMargin + 7, 200, topMargin + 7);

      // Start coupon grid after header
      const MARGIN = 20;
      const CARDS_PER_ROW = 2;
      const CARDS_PER_COL = 3;
      const SPACING = 5;

      for (let i = 0; i < coupons.length; i += 6) {
        if (i > 0) pdf.addPage();

        for (let row = 0; row < CARDS_PER_COL; row++) {
          for (let col = 0; col < CARDS_PER_ROW; col++) {
            const index = i + row * CARDS_PER_ROW + col;
            if (index >= coupons.length) continue;

            const x = MARGIN + col * (CARD_WIDTH + SPACING);
            const y = MARGIN + row * (CARD_HEIGHT + SPACING);

            const container = document.createElement('div');
            container.style.cssText = `width:${CARD_WIDTH}mm;height:${CARD_HEIGHT}mm;position:fixed;left:-9999px;background:white;`;
            document.body.appendChild(container);

            const root = createRoot(container);
            root.render(<PreviewCard coupon={coupons[index]} />);

            await new Promise((r) => setTimeout(r, 1000));

            const canvas = await html2canvas(container, {
              scale: 2,
              useCORS: true,
              logging: false,
            });

            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', x, y, CARD_WIDTH, CARD_HEIGHT);

            root.unmount();
            document.body.removeChild(container);
          }
        }
      }

      // Generate filename before saving
      const filename = `justpass_${coupons[0].creator}_${coupons.length}coupons_${format(new Date(), 'yyyyMMdd-HHmmss')}.pdf`;
      
      // Add try-catch specifically for the save operation
      try {
        await pdf.save(filename);
        console.log('PDF saved successfully:', filename);
        
        setPdfState({
          filename,
          showDialog: true,
        });

        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (saveError) {
        console.error('Error saving PDF:', saveError);
        throw new Error('Failed to save PDF file');
      }

    } catch (error) {
      console.error('PDF Error:', error);
      toast.error('PDF generation failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setGeneratedCoupons([]);
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
    setShowConfirmation(true);
  };

  // Clean up states when dialog is closed
  const handleDialogClose = () => {
    setPdfState((prev) => ({
      ...prev,
      showDialog: false
    }));
  };

  const generateCoupons = async () => {
    try {
      setIsGenerating(true);
      setProgress(0);
      setGeneratedCoupons([]); // Clear before starting

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
        const coupon = { code, creator: creatorName, timestamp: new Date().toISOString() };
        newCoupons.push(coupon);
        setGeneratedCoupons([...newCoupons]); // Keep this state update
        setProgress(((i + 1) * 100) / numCoupons);
      }
      console.log('Generated coupons:', newCoupons);
      await generatePDF(newCoupons);
      // Clear state only after PDF is complete
      setTimeout(() => setGeneratedCoupons([]), 1000);

    } catch (error) {
      console.error('Error:', error);
      toast.error('Error generating coupons');
      setGeneratedCoupons([]); // Clear on error
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
          width="100%" height="100%"
          href={backgroundImage}
          preserveAspectRatio="xMidYMid meet"
          style={{
            objectFit: 'contain',
          }}
        />
      )}

      <text
        x="5"
        y="8"
        fontFamily="Arial"
        fontSize="3"
        fill={textColor}
        textAnchor="start"
      >
        {creatorName}
      </text>
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
    <div className="relative flex h-full w-full bg-background">
      {/* Left Section - Input Forms */}
      <div className="w-[30%] h-full p-3 border-r">
        <Card className="h-full overflow-auto shadow-sm">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-base font-medium">Interview Card Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            {/* Group 1 */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="numCoupons" className="text-xs font-medium">Number of Cards (Max {MAX_COUPONS})</Label>
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
                  className="h-8"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="creatorName" className="text-xs font-medium">Price</Label>
                <Input
                  id="creatorName"
                  value={creatorName}
                  onChange={(e) => setCreatorName(e.target.value)}
                  className="h-8"
                  placeholder="Enter price (e.g. $199)"
                />
              </div>
            </div>

            {/* Group 2 */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Website URL (max 30 characters)</Label>
                <Input
                  value={websiteUrl}
                  onChange={(e) => {
                    const newUrl = e.target.value;
                    setWebsiteUrl(newUrl);
                    validateWebsite(newUrl);
                  }}
                  className={cn("h-8", websiteError && "border-red-500")}
                  placeholder="www.example.com"
                />
                {websiteError && (
                  <div className="text-xs text-red-500 mt-1">{websiteError}</div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Valid Until Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-8 text-sm",
                        !validUntil && "text-muted-foreground",
                        dateError && "border-red-500"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-3.5 w-3.5" />
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
                  <div className="text-xs text-red-500 mt-1">{dateError}</div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Text Color</Label>
                <div className="flex gap-3 items-center">
                  <Input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-16 h-8 p-1 cursor-pointer"
                  />
                  <span className="text-xs text-gray-500">{textColor}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Validity Box Color</Label>
                <div className="flex gap-3 items-center">
                  <Input
                    type="color"
                    value={validityBoxColor}
                    onChange={(e) => setValidityBoxColor(e.target.value)}
                    className="w-16 h-8 p-1 cursor-pointer"
                  />
                  <span className="text-xs text-gray-500">{validityBoxColor}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Background Image</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="cursor-pointer text-xs h-9 py-1.5"
                />
                <p className="text-xs text-muted-foreground mt-1">Upload an image for the card background</p>
              </div>
            </div>

            <Button
              className="w-full mt-4"
              size="sm"
              onClick={handleGenerateClick}
              disabled={isGenerating || !creatorName || !websiteUrl || !validUntil || !isImageUploaded}
            >
              {isGenerating ? 'Generating...' : 'Generate Interview Cards'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Middle Section - Preview */}
      <div className="w-[35%] h-full p-3 border-r">
        <Card className="h-full flex flex-col shadow-sm">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-base font-medium">Preview</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-4 flex items-center justify-center">
            <div className="w-full max-w-md aspect-[1.585]">
              <PreviewCard />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Section - Generated Coupons */}
      <div className="w-[35%] h-full p-3">
        <Card className="h-full flex flex-col shadow-sm">
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base font-medium">Generated Interview Cards</CardTitle>
              {isGenerating && (
                <span className="text-xs text-muted-foreground">
                  {generatedCoupons.length} of {numCoupons} generated
                </span>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 p-4 overflow-auto">
            {isGenerating && (
              <div className="space-y-2 mb-4">
                <Progress value={progress} className="w-full h-2" />
                <div className="text-xs text-muted-foreground">
                  Please wait while the Interview Cards are being generated.
                </div>
              </div>
            )}

            {!isGenerating && !generatedCoupons.length && (
              <div className="flex items-center justify-center h-full">
                <div className="text-sm text-muted-foreground">No Interview Cards generated yet</div>
              </div>
            )}

            <div
              ref={couponsGridRef}
              className="grid grid-cols-2 gap-3 bg-white rounded border p-3 mx-auto w-full"
            >
              {generatedCoupons.map((coupon) => (
                <div
                  key={coupon.code}
                  className="aspect-[1.585] w-full border border-dashed border-gray-200"
                  style={{
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
        <AlertDialogContent className="bg-white p-5 rounded-lg max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-semibold mb-2">
              Confirm Interview Card Generation
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-sm font-medium">{numCoupons} cards × 30 minutes = </span>
                  <span className="text-lg font-bold text-primary">{numCoupons * 30} minutes</span>
                </div>
                <p className="text-xs text-gray-600">
                  This action cannot be reversed
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="text-xs h-8">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={generateCoupons} className="text-xs h-8">I Agree</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {pdfState.showDialog && (
        <DownloadConfirmation
          filename={pdfState.filename}
          isOpen={pdfState.showDialog}
          onClose={handleDialogClose}
        />
      )}

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