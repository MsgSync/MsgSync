import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Plus, Search, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CampaignsPage() {
    const campaigns = [
        {
            id: "CMP-001",
            name: "Black Friday Sale",
            status: "Completed",
            type: "Promotional",
            recipients: 12500,
            delivered: 12450,
            date: "2024-11-24",
        },
        {
            id: "CMP-002",
            name: "User Onboarding Series",
            status: "Active",
            type: "Lifecycle",
            recipients: 342,
            delivered: 340,
            date: "2024-12-01",
        },
        {
            id: "CMP-003",
            name: "Holiday Greetings",
            status: "Draft",
            type: "Seasonal",
            recipients: 0,
            delivered: 0,
            date: "2024-12-25",
        },
        {
            id: "CMP-004",
            name: "Weekly Newsletter",
            status: "Processing",
            type: "Newsletter",
            recipients: 5000,
            delivered: 230,
            date: "2024-12-31"
        }
    ];

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> New Campaign
                </Button>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle>All Campaigns</CardTitle>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search campaigns..." className="pl-8 w-[250px]" />
                        </div>
                        <Button variant="outline" size="icon">
                            <Filter className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Strategies</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Recipients</TableHead>
                                <TableHead>Delivered</TableHead>
                                <TableHead className="text-right">Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {campaigns.map((campaign) => (
                                <TableRow key={campaign.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span>{campaign.name}</span>
                                            <span className="text-xs text-muted-foreground">{campaign.id}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={campaign.status === "Active" ? "default" : campaign.status === "Completed" ? "secondary" : "outline"}>
                                            {campaign.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{campaign.type}</TableCell>
                                    <TableCell>{campaign.recipients.toLocaleString()}</TableCell>
                                    <TableCell>{campaign.delivered.toLocaleString()}</TableCell>
                                    <TableCell className="text-right">{campaign.date}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
