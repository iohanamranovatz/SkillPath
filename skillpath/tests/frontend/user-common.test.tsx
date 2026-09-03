import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Avatar, AvatarImage, AvatarFallback, AvatarBadge, AvatarGroup, AvatarGroupCount } from '@/frontend/user/common/avatar'
import { Badge, badgeVariants } from '@/frontend/user/common/badge'
import { Button, buttonVariants } from '@/frontend/user/common/button'
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardAction,
    CardContent,
    CardFooter,
} from '@/frontend/user/common/card'
import { Progress, ProgressLabel, ProgressValue } from '@/frontend/user/common/progress'
import { Separator } from '@/frontend/user/common/separator'
import { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants } from '@/frontend/user/common/tabs'
import { cn } from '@/frontend/user/lib/utils'

describe('frontend/user/lib/utils', () => {
    it('combina clasele si rezolva conflictele Tailwind', () => {
        expect(cn('px-2', 'px-4')).toBe('px-4')
        expect(cn('text-sm', false && 'hidden', undefined, 'font-bold')).toBe('text-sm font-bold')
    })
})

describe('componente comune (user)', () => {
    it('Avatar randeaza fallback-ul, badge-ul si grupul', () => {
        render(
            <AvatarGroup>
                <Avatar size="lg">
                    <AvatarImage src="/x.png" alt="Ana" />
                    <AvatarFallback>AN</AvatarFallback>
                    <AvatarBadge data-testid="badge" />
                </Avatar>
                <AvatarGroupCount>+3</AvatarGroupCount>
            </AvatarGroup>
        )

        expect(screen.getByText('AN')).toBeTruthy()
        expect(screen.getByText('+3')).toBeTruthy()
        expect(screen.getByTestId('badge')).toBeTruthy()
    })

    it.each(['default', 'secondary', 'destructive', 'outline', 'ghost', 'link'] as const)(
        'Badge randeaza varianta %s',
        (variant) => {
            render(<Badge variant={variant}>Nou</Badge>)

            expect(screen.getByText('Nou')).toBeTruthy()
            expect(badgeVariants({ variant })).toContain('inline-flex')
        }
    )

    it.each(['default', 'outline', 'secondary', 'ghost', 'destructive', 'link'] as const)(
        'Button randeaza varianta %s',
        (variant) => {
            render(<Button variant={variant}>Trimite</Button>)

            expect(screen.getByRole('button', { name: 'Trimite' })).toBeTruthy()
        }
    )

    it.each(['default', 'xs', 'sm', 'lg', 'icon', 'icon-xs', 'icon-sm', 'icon-lg'] as const)(
        'buttonVariants genereaza clase pentru dimensiunea %s',
        (size) => {
            expect(buttonVariants({ size })).toBeTruthy()
        }
    )

    it('Card randeaza toate sub-componentele', () => {
        render(
            <Card size="sm">
                <CardHeader>
                    <CardTitle>Titlu</CardTitle>
                    <CardDescription>Descriere</CardDescription>
                    <CardAction>Actiune</CardAction>
                </CardHeader>
                <CardContent>Continut</CardContent>
                <CardFooter>Subsol</CardFooter>
            </Card>
        )

        ;['Titlu', 'Descriere', 'Actiune', 'Continut', 'Subsol'].forEach((text) => {
            expect(screen.getByText(text)).toBeTruthy()
        })
    })

    it('Progress randeaza eticheta si valoarea', () => {
        const { container } = render(
            <Progress value={40}>
                <ProgressLabel>Progres</ProgressLabel>
                <ProgressValue />
            </Progress>
        )

        expect(screen.getByText('Progres')).toBeTruthy()
        expect(container.querySelector('[data-slot="progress-indicator"]')).toBeTruthy()
    })

    it.each(['horizontal', 'vertical'] as const)('Separator randeaza orientarea %s', (orientation) => {
        const { container } = render(<Separator orientation={orientation} />)

        expect(container.querySelector('[data-slot="separator"]')).toBeTruthy()
    })

    it('Tabs afiseaza panoul activ', () => {
        render(
            <Tabs defaultValue="a">
                <TabsList>
                    <TabsTrigger value="a">Prima</TabsTrigger>
                    <TabsTrigger value="b">A doua</TabsTrigger>
                </TabsList>
                <TabsContent value="a">Continut A</TabsContent>
                <TabsContent value="b">Continut B</TabsContent>
            </Tabs>
        )

        expect(screen.getByText('Prima')).toBeTruthy()
        expect(screen.getByText('Continut A')).toBeTruthy()
        expect(tabsListVariants({ variant: 'line' })).toContain('gap-1')
    })
})
