"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const data = [
    {
        average: 400,
        today: 240,
    },
    {
        average: 300,
        today: 139,
    },
    {
        average: 200,
        today: 980,
    },
    {
        average: 278,
        today: 390,
    },
    {
        average: 189,
        today: 480,
    },
    {
        average: 239,
        today: 380,
    },
    {
        average: 349,
        today: 430,
    },
]

export function OverviewChart() {
    return (
        <Card className="col-span-4">
            <CardHeader>
                <CardTitle>Overview</CardTitle>
                <CardDescription>
                    Message volume over the last 7 days.
                </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={data}>
                        <XAxis
                            dataKey="name"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}`}
                        />
                        <Tooltip
                            contentStyle={{ background: 'var(--background)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                        />
                        <Line
                            type="monotone"
                            dataKey="average"
                            stroke="#888888"
                            strokeWidth={2}
                            activeDot={{
                                r: 8,
                            }}
                            style={
                                {
                                    opacity: 0.25,
                                } as React.CSSProperties
                            }
                        />
                        <Line
                            type="monotone"
                            dataKey="today"
                            stroke="var(--primary)"
                            strokeWidth={2}
                            activeDot={{
                                r: 8,
                            }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
