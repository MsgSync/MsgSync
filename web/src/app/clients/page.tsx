import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Plus, Search, MoreHorizontal, Mail, Phone } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const clients = [
    {
        id: "CL-001",
        name: "Acme Corp",
        email: "contact@acme.com",
        phone: "+1 (555) 123-4567",
        status: "Active",
        balance: "$1,250.00",
        plan: "Enterprise",
    },
    {
        id: "CL-002",
        name: "Globex Inc",
        email: "support@globex.com",
        phone: "+1 (555) 987-6543",
        status: "Active",
        balance: "$5,000.00",
        plan: "Pro",
    },
    {
        id: "CL-003",
        name: "Soylent Corp",
        email: "info@soylent.com",
        phone: "+1 (555) 000-0000",
        status: "Suspended",
        balance: "$0.00",
        plan: "Starter",
    },
    {
        id: "CL-004",
        name: "Initech",
        email: "peter@initech.com",
        phone: "+1 (555) 321-4321",
        status: "Active",
        balance: "$750.50",
        plan: "Pro",
    },
    {
        id: "CL-005",
        name: "Umbrella Corp",
        email: "wesker@umbrella.com",
        phone: "+1 (555) 666-7777",
        status: "Inactive",
        balance: "$10,000.00",
        plan: "Enterprise",
    },
]

export default function ClientsPage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
                    <p className="text-muted-foreground">Manage your client base and their subscriptions.</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Client
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Client List</CardTitle>
                    <CardDescription>View and manage all registered clients.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center py-4">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search clients..." className="pl-8" />
                        </div>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Client</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead className="text-right">Balance</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {clients.map((client) => (
                                <TableRow key={client.id}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{client.name}</span>
                                            <span className="text-xs text-muted-foreground">{client.id}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-3 w-3" /> {client.email}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-3 w-3" /> {client.phone}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={client.status === "Active" ? "default" : client.status === "Suspended" ? "destructive" : "secondary"}>
                                            {client.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline">{client.plan}</Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">{client.balance}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Open menu</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem>View details</DropdownMenuItem>
                                                <DropdownMenuItem>Edit client</DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-destructive">Suspend client</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
