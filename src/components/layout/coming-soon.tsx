import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ComingSoon({ title, phase }: { title: string; phase: string }) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <Card>
        <CardHeader>
          <CardTitle>Em construção</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Este módulo será implementado na {phase}.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
