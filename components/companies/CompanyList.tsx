// components/companies/CompanyList.tsx
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Search, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Breadcrumbs from "../layout/Breadcrumbs";
import { toast } from "sonner";

interface Company {
  id: string;
  name: string;
  created_at: string;
}

export default function CompanyList() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Fetch companies from Supabase
  useEffect(() => {
    async function fetchCompanies() {
      setIsLoading(true);
      
      try {
        const { data, error } = await supabase
          .from("companies")
          .select("*")
          .order("name");
          
        if (error) throw error;
        setCompanies(data || []);
      } catch (error) {
        console.error("Error fetching companies:", error);
        toast.error("Failed to load companies");
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchCompanies();
  }, []);
  
  // Filter companies based on search term
  const filteredCompanies = companies.filter(company => 
    company.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <>
      <Breadcrumbs items={[{ label: "Companies" }]} />
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xl">Companies</CardTitle>
          <Button 
            onClick={() => router.push("/companies?view=new")}
            className="text-md flex items-center"
          >
            <PlusCircle className="mr-2 h-5 w-5" />
            Add Company
          </Button>
        </CardHeader>
        
        <CardContent>
          <div className="flex mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search companies..."
                className="pl-8 text-md h-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-primary"></div>
              <p className="mt-2 text-gray-500">Loading companies...</p>
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="text-center py-12 border rounded-md bg-gray-50">
              <p className="text-gray-500 mb-4">No companies found</p>
              <Button 
                variant="outline" 
                onClick={() => router.push("/companies?view=new")}
              >
                Create your first company
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60%] text-md">Company Name</TableHead>
                  <TableHead className="text-md">Created</TableHead>
                  <TableHead className="text-md text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium text-md">
                      <a 
                        onClick={(e) => {
                          e.preventDefault();
                          router.push(`/tests?view=list&companyId=${company.id}`);
                        }}
                        href="#"
                        className="hover:text-blue-600 hover:underline cursor-pointer"
                      >
                        {company.name}
                      </a>
                    </TableCell>
                    <TableCell className="text-md">
                      {new Date(company.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/companies?view=edit&id=${company.id}`)}
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // Will implement deletion functionality later
                          if (confirm("Are you sure you want to delete this company?")) {
                            // Delete company
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}