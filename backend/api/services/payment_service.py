import stripe
from api.core.config import get_settings
from api.models.order import PaymentIntentRequest

settings = get_settings()
if settings.STRIPE_SECRET_KEY:
    stripe.api_key = settings.STRIPE_SECRET_KEY

class PaymentService:
    def __init__(self):
        pass
    
    async def create_payment_intent(self, request: PaymentIntentRequest) -> dict:
        try:
            intent = stripe.PaymentIntent.create(
                amount=request.amount,
                currency=request.currency,
                metadata={'integration_check': 'accept_a_payment'}
            )
            return {"client_secret": intent.client_secret}
        except Exception as e:
            raise Exception(f"Payment intent creation failed: {str(e)}")