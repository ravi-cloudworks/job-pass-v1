// components/companies/CompanyForm.tsx
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Breadcrumbs from "../layout/Breadcrumbs";
import { ArrowLeft, Save } from "lucide-react";

interface CompanyFormProps {
  companyId?: string; // Optional - if provided, we're editing an existing company
}

export default function CompanyForm({ companyId }: CompanyFormProps) {
  const router = useRouter();
//   const { toast } = useToast();
  const [companyName, setCompanyName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const isEditMode = !!companyId;
  
  // If editing, fetch company data
  useEffect(() => {
    if (companyId) {
      async function fetchCompany() {
        setIsLoading(true);
        
        try {
          const { data, error } = await supabase
            .from("companies")
            .select("*")
            .eq("id", companyId)
            .single();
            
          if (error) throw error;
          if (data) {
            setCompanyName(data.name);
          }
        } catch (error) {
          console.error("Error fetching company:", error);
          toast.error("Failed to load company details");
        } finally {
          setIsLoading(false);
        }
      }
      
      fetchCompany();
    }
  }, [companyId, toast]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      if (isEditMode) {
        // Update existing company
        const { error } = await supabase
          .from("companies")
          .update({ name: companyName })
          .eq("id", companyId);
          
        if (error) throw error;
        
    

        toast.success("The company has been updated successfully");
      } else {
        // Create new company
        const { error } = await supabase
          .from("companies")
          .insert([{ name: companyName }]);
          
        if (error) throw error;
        
      

        toast.success("The company has been created successfully");
      }
      
      // Navigate back to companies list
      router.push("/companies?view=list");
    } catch (error) {
      console.error("Error saving company:", error);
 
      toast.error(`Failed to ${isEditMode ? "update" : "create"} company`);
    } finally {
      setIsSaving(false);
    }
  };
  
  const breadcrumbItems = isEditMode
    ? [
        { label: "Companies", onClick: () => router.push("/companies?view=list") },
        { label: companyName, onClick: () => router.push(`/tests?view=new&id=${companyId}`) },
        { label: "Edit" },
      ]
    : [
        { label: "Companies", onClick: () => router.push("/companies?view=list") },
        { label: "Add New Company" },
      ];
  
  if (isLoading) {
    return (
      <>
        <Breadcrumbs items={breadcrumbItems} />
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-primary"></div>
          <p className="mt-2 text-gray-500">Loading company details...</p>
        </div>
      </>
    );
  }
  
  return (
    <>
      <Breadcrumbs items={breadcrumbItems} />
      
      <Card>
        <CardHeader>
          <CardTitle>{isEditMode ? "Edit Company" : "Add New Company"}</CardTitle>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-base">Company Name</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter company name"
                  className="text-lg h-12"
                  required
                  autoFocus
                />
              </div>
              
              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/companies?view=list")}
                  className="text-base h-12"
                >
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Back to Companies
                </Button>
                
                <Button 
                  type="submit" 
                  disabled={isSaving || !companyName.trim()}
                  className="text-base h-12"
                >
                  {isSaving ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-e-transparent"></div>
                      {isEditMode ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-5 w-5" />
                      {isEditMode ? "Update Company" : "Create Company"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}