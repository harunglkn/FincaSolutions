import { Topbar } from "@/components/layout/topbar";
import { Button, LinkButton } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function LeadDetailPage(
  props: PageProps<"/leads/[id]">,
) {
  const { id } = await props.params;

  return (
    <>
      <Topbar
        title={`Lead ${id}`}
        subtitle="Details, Antworten, Ankaufspreis und Termin"
        action={
          <>
            <LinkButton href="/leads" variant="ghost" size="sm">
              ← Zur Liste
            </LinkButton>
            <Button size="sm">Termin anlegen</Button>
          </>
        }
      />

      <div className="p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Fahrzeug</CardTitle>
              <Badge tone="warning">Antwort offen</Badge>
            </CardHeader>
            <CardBody className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <Field label="Modell" value="BMW 320d Touring" />
              <Field label="Baujahr" value="2019" />
              <Field label="Kilometerstand" value="89.000 km" />
              <Field label="Getriebe" value="Automatik" />
              <Field label="Kraftstoff" value="Diesel" />
              <Field label="Erstzulassung" value="04/2019" />
              <Field label="HU bis" value="03/2026" />
              <Field label="Farbe" value="Mineralweiß" />
              <Field label="Standort" value="Köln" />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Antworten des Verkäufers</CardTitle>
            </CardHeader>
            <CardBody className="space-y-4">
              <Message
                from="Verkäufer · Marco S."
                time="vor 2 Std."
                text="Hallo, das Fahrzeug ist scheckheftgepflegt, Vorbesitzer 2. Anfrage gerne per Telefon."
              />
              <Message
                from="Sie"
                time="vor 1 Std."
                text="Vielen Dank. Wir würden 13.200 € anbieten — passt das?"
                mine
              />
              <Message
                from="Verkäufer · Marco S."
                time="vor 20 Min."
                text="13.200 € ist zu wenig. Vorstellung: 14.500 €."
              />
              <form className="pt-2 flex gap-2">
                <input
                  type="text"
                  placeholder="Nachricht schreiben …"
                  className="flex-1 h-11 px-3 rounded-lg border border-ink-200 bg-white text-sm"
                />
                <Button type="submit">Senden</Button>
              </form>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Einkaufspotenzial</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3 text-sm">
              <Field label="Verkäuferpreis" value="14.900 €" />
              <Field label="Marktwert (Schätzung)" value="15.400 €" />
              <Field label="Ihr Ankaufspreis" value="13.200 €" highlight />
              <Field label="Erwartete Marge" value="2.200 €" />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Termin</CardTitle>
            </CardHeader>
            <CardBody className="text-sm">
              <p className="text-ink-600">
                Noch kein Termin vereinbart.
              </p>
              <Button className="mt-3 w-full">Termin anlegen</Button>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quelle</CardTitle>
            </CardHeader>
            <CardBody className="text-sm space-y-2">
              <Field label="Kampagne" value="Premium-Kombis" />
              <Field label="Suchlauf gestartet" value="Heute 08:14" />
              <Field label="Anfrage versendet" value="Heute 09:02" />
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}

function Field({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5">
      <span className="text-ink-500">{label}</span>
      <span
        className={`font-medium ${
          highlight ? "text-brand-800 text-base" : "text-ink-900"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function Message({
  from,
  time,
  text,
  mine,
}: {
  from: string;
  time: string;
  text: string;
  mine?: boolean;
}) {
  return (
    <div className={mine ? "flex justify-end" : "flex"}>
      <div
        className={[
          "max-w-md rounded-xl px-4 py-3 text-sm",
          mine
            ? "bg-brand-700 text-white"
            : "bg-ink-100 text-ink-900",
        ].join(" ")}
      >
        <div
          className={`text-xs mb-1 ${
            mine ? "text-brand-100" : "text-ink-500"
          }`}
        >
          {from} · {time}
        </div>
        {text}
      </div>
    </div>
  );
}
