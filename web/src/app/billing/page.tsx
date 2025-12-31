"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Download, Plus } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

const invoices = [
    {
        invoice: "INV001",
        status: "Paid",
        amount: "$250.00",
        date: "2024-12-01",
        method: "Credit Card (**** 4242)",
    },
    {
        invoice: "INV002",
        status: "Paid",
        amount: "$150.00",
        date: "2024-11-01",
        method: "PayPal",
    },
    {
        invoice: "INV003",
        status: "Unpaid",
        amount: "$350.00",
        date: "2024-12-30",
        method: "Bank Transfer",
    },
    {
        invoice: "INV004",
        status: "Paid",
        amount: "$450.00",
        date: "2024-10-01",
        method: "Credit Card (**** 4242)",
    },
]

export default function BillingPage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Current Balance</CardTitle>
                        <CardDescription>Your available credit for messaging.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">$1,234.56</div>
                    </CardContent>
                    <CardFooter>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" /> Add Funds
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add Funds</DialogTitle>
                                    <DialogDescription>
                                        Add credit to your account to continue sending messages.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <label className="text-right text-sm">Amount</label>
                                        <Input id="amount" defaultValue="$100.00" className="col-span-3" />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit">Proceed to Payment</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardFooter>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Payment Method</CardTitle>
                        <CardDescription>Manage your payment details.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4 rounded-md border p-4">
                            <CreditCard className="h-6 w-6" />
                            <div className="flex-1">
                                <p className="text-sm font-medium">Visa ending in 4242</p>
                                <p className="text-sm text-muted-foreground">Expires 12/25</p>
                            </div>
                            <Button variant="ghost" size="sm">Edit</Button>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" className="w-full">Add Payment Method</Button>
                    </CardFooter>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Invoices</CardTitle>
                    <CardDescription>View your recent billing history.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Invoice</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Method</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoices.map((invoice) => (
                                <TableRow key={invoice.invoice}>
                                    <TableCell className="font-medium">{invoice.invoice}</TableCell>
                                    <TableCell>
                                        <Badge variant={invoice.status === "Paid" ? "secondary" : "destructive"}>
                                            {invoice.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{invoice.method}</TableCell>
                                    <TableCell>{invoice.date}</TableCell>
                                    <TableCell className="text-right">{invoice.amount}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon">
                                            <Download className="h-4 w-4" />
                                        </Button>
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
