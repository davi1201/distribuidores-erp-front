import api from '@/lib/api';

export interface CardData {
  number: string;
  holder_name: string;
  exp_month: string;
  exp_year: string;
  cvv: string;
}

export const createCardToken = async (cardData: CardData): Promise<string> => {
  const publicKey = process.env.NEXT_PUBLIC_PAGARME_KEY;
  
  const url = `https://api.pagar.me/core/v5/tokens?appId=${publicKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        type: 'card',
        card: {
          number: cardData.number.replace(/\D/g, ''), // Remove espaços/pontos
          holder_name: cardData.holder_name,
          exp_month: cardData.exp_month,
          exp_year: cardData.exp_year,
          cvv: cardData.cvv,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Tenta extrair mensagem de erro da API ou usa genérica
      const errorMsg = data.errors ? JSON.stringify(data.errors) : 'Dados do cartão inválidos.';
      throw new Error(errorMsg);
    }

    return data.id; // Retorna o token (ex: token_xxxxxxxx)
  } catch (error) {
    console.error('Erro na tokenização Pagar.me:', error);
    throw error; // Re-lança para o componente tratar (ex: mostrar notificação)
  }
};

export const subscribe = async (payload: any) => {
  const { data } = await api.post('/payment/subscribe', payload)
  return data
}