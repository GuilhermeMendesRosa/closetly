# Regras da Closetly

## 1. Objetivo

A Closetly calcula quais roupas devem ser colocadas na mochila para uma estadia, considerando a quantidade de dias, o clima de cada dia e as atividades físicas planejadas.

Esta primeira versão descreve somente as regras de negócio. Ela não depende de tecnologia, interface ou integração com serviços de previsão do tempo.

## 2. Entradas

O cálculo recebe quatro valores obrigatórios:

| Campo | Descrição |
| --- | --- |
| `dias` | Quantidade de dias em que o usuário precisará de roupas. |
| `dias_frios` | Quantidade de dias classificados manualmente como frios. |
| `dias_quentes` | Quantidade de dias classificados manualmente como quentes. |
| `treinos` | Quantidade de atividades físicas planejadas durante a estadia. |

Para simplificar as fórmulas, este documento usa as seguintes abreviações:

- `D = dias`
- `F = dias_frios`
- `Q = dias_quentes`
- `T = treinos`

## 3. Validações

As entradas só são válidas quando todas as condições abaixo forem atendidas:

1. `dias`, `dias_frios` e `dias_quentes` usam intervalos de meio dia; `treinos` é um número inteiro.
2. `dias` é maior ou igual a `1`.
3. `dias_frios`, `dias_quentes` e `treinos` são maiores ou iguais a `0`.
4. A soma de `dias_frios` e `dias_quentes` é igual a `dias`: `F + Q = D`.

Pode haver mais de um treino por dia. Portanto, `treinos` pode ser maior do que `dias`.

Se alguma validação falhar, a checklist não deve ser calculada até que as entradas sejam corrigidas.

## 4. Saída

O resultado é uma checklist contendo cada tipo de peça e a quantidade que deve ser colocada na mochila.

Itens cuja quantidade calculada seja `0` podem ser omitidos da checklist apresentada ao usuário.

## 5. Regras de cálculo

| Item | Quantidade | Regra |
| --- | ---: | --- |
| Camisetas boas | `arredondar_para_cima(D)` | Uma para cada dia ou fração da estadia. |
| Camisetas para ficar em casa | `arredondar_para_cima(D)` | Uma para cada dia ou fração da estadia. |
| Casacos | Aplicar a regra de casacos sobre `arredondar_para_cima(F)` | Um casaco para um dia frio; dois a partir de dois dias; depois, um para cada período de até dois dias frios. |
| Calças | Aplicar a regra de calças sobre `arredondar_para_cima(F)` | Uma calça para um dia frio; duas a partir de dois dias; depois, uma para cada período de até dois dias frios. |
| Bermudas | `máximo(arredondar_para_cima(Q), 2)` se `Q > 0`; senão `0` | Em uma estadia com dias quentes, levar uma por dia ou fração, respeitando o mínimo de duas. |
| Conjuntos de academia | `T` | Um conjunto para cada treino planejado. |
| Pares de tênis para atividade física | `1` se `T > 0`; senão `0` | Um único par quando houver pelo menos um treino. |
| Cuecas | `arredondar_para_cima(D) + T + 1` | Uma por dia ou fração, uma adicional por treino e uma peça de reserva. |
| Pares de meias | `arredondar_para_cima(D) + T + 1` | Um par por dia ou fração, um adicional por treino e um par de reserva. |

Um **conjunto de academia** é tratado como um único item lógico. Nesta versão, ele não é dividido em camiseta, shorts ou outras peças.

## 6. Exemplos

### 6.1. Dois dias frios, sem treino

Entradas:

- `D = 2`
- `F = 2`
- `Q = 0`
- `T = 0`

Checklist:

- 2 camisetas boas
- 2 camisetas para ficar em casa
- 2 casacos
- 2 calças
- 3 cuecas
- 3 pares de meias

### 6.2. Dois dias quentes, com um treino

Entradas:

- `D = 2`
- `F = 0`
- `Q = 2`
- `T = 1`

Checklist:

- 2 camisetas boas
- 2 camisetas para ficar em casa
- 2 bermudas
- 1 conjunto de academia
- 1 par de tênis para atividade física
- 4 cuecas
- 4 pares de meias

### 6.3. Três dias mistos, com dois treinos

Entradas:

- `D = 3`
- `F = 1`
- `Q = 2`
- `T = 2`

Checklist:

- 3 camisetas boas
- 3 camisetas para ficar em casa
- 1 casaco
- 1 calça
- 2 bermudas
- 2 conjuntos de academia
- 1 par de tênis para atividade física
- 6 cuecas
- 6 pares de meias

## 7. Cenários de validação

| Cenário | Entradas | Resultado esperado |
| --- | --- | --- |
| Zero dias | `D = 0`, `F = 0`, `Q = 0`, `T = 0` | Inválido, pois `dias` deve ser pelo menos `1`. |
| Valor negativo | `D = 2`, `F = 2`, `Q = 0`, `T = -1` | Inválido, pois nenhum valor pode ser negativo. |
| Total de climas menor que os dias | `D = 3`, `F = 1`, `Q = 1`, `T = 0` | Inválido, pois `F + Q` é diferente de `D`. |
| Total de climas maior que os dias | `D = 2`, `F = 2`, `Q = 1`, `T = 0` | Inválido, pois `F + Q` é diferente de `D`. |
| Meio dia | `D = 1.5`, `F = 0.5`, `Q = 1`, `T = 0` | Válido; as quantidades de roupas são arredondadas para cima. |
| Fração menor que meio dia | `D = 1.25`, `F = 0.5`, `Q = 0.75`, `T = 0` | Inválido, pois a duração e o clima usam intervalos de meio dia. |
| Mais de um treino por dia | `D = 2`, `F = 0`, `Q = 2`, `T = 3` | Válido; a checklist deve considerar os três treinos. |

## 8. Premissas e limites da primeira versão

- A duração pode ser informada em intervalos de meio dia. Para calcular peças, toda fração é arredondada para cima.
- O clima de cada dia é informado manualmente pelo usuário como frio ou quente.
- Cada treino exige um conjunto de academia e uma troca adicional de cueca e meias.
- Calças e casacos são calculados em função dos dias frios, com uma peça para cada dois dias e períodos incompletos arredondados para cima. Para um dia frio, leva-se uma peça; a partir de dois dias frios, o mínimo é de duas peças.
- O mínimo de duas peças continua sendo aplicado às bermudas quando houver dias quentes.
- Pijamas, calçados comuns, itens de higiene pessoal, toalhas e acessórios não fazem parte desta versão.
