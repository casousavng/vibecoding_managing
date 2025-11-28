import { useQuery } from "@tanstack/react-query";
import { Project } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, FileSpreadsheet } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Exports() {
    const { data: projects, isLoading } = useQuery<Project[]>({
        queryKey: ["/api/projects"],
    });

    const exportToCSV = () => {
        if (!projects) return;

        const headers = ["ID", "Name", "Client", "Status", "Start Date", "End Date", "Manager"];
        const csvContent = [
            headers.join(","),
            ...projects.map(p => [
                p.id,
                `"${p.name}"`,
                `"${p.client}"`,
                p.status,
                new Date(p.startDate).toLocaleDateString(),
                new Date(p.endDate).toLocaleDateString(),
                `"${p.manager}"`
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `projects_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportToPDF = () => {
        if (!projects) return;

        const doc = new jsPDF();

        doc.setFontSize(20);
        doc.text("Projects Report", 14, 22);
        doc.setFontSize(11);
        doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 30);

        const tableData = projects.map(p => [
            p.id,
            p.name,
            p.client,
            p.status,
            new Date(p.startDate).toLocaleDateString(),
            new Date(p.endDate).toLocaleDateString(),
            p.manager
        ]);

        autoTable(doc, {
            head: [["ID", "Name", "Client", "Status", "Start", "End", "Manager"]],
            body: tableData,
            startY: 40,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [41, 128, 185] },
        });

        doc.save(`projects_report_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const exportToDetailedPDF = () => {
        if (!projects) return;

        const doc = new jsPDF({ orientation: 'landscape' });

        doc.setFontSize(20);
        doc.text("Detailed Projects Report", 14, 22);
        doc.setFontSize(11);
        doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 30);

        const tableData = projects.map(p => [
            p.id,
            p.name,
            p.client,
            p.clientContact || "-",
            p.clientPhone || "-",
            p.clientEmail || "-",
            p.estimatedBudget || "-",
            p.status,
            new Date(p.startDate).toLocaleDateString(),
            new Date(p.endDate).toLocaleDateString(),
            p.manager
        ]);

        autoTable(doc, {
            head: [["ID", "Name", "Client", "Contact", "Phone", "Email", "Budget", "Status", "Start", "End", "Manager"]],
            body: tableData,
            startY: 40,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [102, 51, 153] }, // Purple header
        });

        doc.save(`detailed_projects_report_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    if (isLoading) {
        return <div>Loading projects...</div>;
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-4xl font-bold tracking-tight mb-2">Exports</h1>
                <p className="text-muted-foreground">Download project reports in various formats.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="bg-card/30 border-white/5 hover:bg-card/40 transition-colors">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileSpreadsheet className="w-5 h-5 text-green-500" />
                            CSV Export
                        </CardTitle>
                        <CardDescription>
                            Export all project data to a CSV file. Suitable for spreadsheet analysis.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={exportToCSV} className="w-full gap-2" variant="outline">
                            <Download className="w-4 h-4" />
                            Download CSV
                        </Button>
                    </CardContent>
                </Card>

                <Card className="bg-card/30 border-white/5 hover:bg-card/40 transition-colors">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-red-500" />
                            Simple PDF Report
                        </CardTitle>
                        <CardDescription>
                            Generate a printable PDF report with formatted project tables.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={exportToPDF} className="w-full gap-2" variant="outline">
                            <Download className="w-4 h-4" />
                            Download PDF
                        </Button>
                    </CardContent>
                </Card>

                <Card className="bg-card/30 border-white/5 hover:bg-card/40 transition-colors">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-purple-500" />
                            Detailed Landscape Report
                        </CardTitle>
                        <CardDescription>
                            Comprehensive landscape report including client details and budget.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={exportToDetailedPDF} className="w-full gap-2" variant="outline">
                            <Download className="w-4 h-4" />
                            Download Detailed PDF
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
