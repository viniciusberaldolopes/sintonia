# Configuração do Stripe

Variáveis necessárias no projeto da Vercel:

- `STRIPE_SECRET_KEY`: chave secreta do Stripe (`sk_test_...` ou `sk_live_...`).
- `STRIPE_WEBHOOK_SECRET`: segredo de assinatura do webhook (`whsec_...`).
- `STRIPE_PARTY_PRICE_ID`: preço único de R$ 9,90 para o Party Pass de 24 horas.
- `STRIPE_PRO_PRICE_ID`: preço recorrente mensal de R$ 19,90 para o plano Pro.
- `APP_URL`: URL pública sem barra final, por exemplo `https://sintonia-seven.vercel.app`.

Webhook público:

`https://sintonia-seven.vercel.app/api/stripe-webhook`

Eventos que devem ser selecionados no Stripe:

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Use primeiro o modo de teste. Depois de validar uma compra completa, substitua as chaves e IDs de preço pelas versões de produção.
