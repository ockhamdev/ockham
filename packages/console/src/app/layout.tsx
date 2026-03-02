import type { Metadata } from 'next'
import { AntdRegistry } from '@ant-design/nextjs-registry'
import { TRPCProvider } from '@/lib/trpc-client'
import './globals.css'

export const metadata: Metadata = {
    title: 'Ockham Console',
    description: 'Ockham Web Console — Team Collaboration Platform',
    icons: null,
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body>
                <AntdRegistry>
                    <TRPCProvider>
                        {children}
                    </TRPCProvider>
                </AntdRegistry>
            </body>
        </html>
    )
}
