import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'

export default function WeightChart({ data, targetWeight, initialWeight }) {
  if (!data || data.length < 2) {
    return (
      <div className="flex items-center justify-center h-64 text-xs text-zinc-400">
        记录至少两天体重后显示趋势
      </div>
    )
  }

  const formattedData = data.map((d) => ({
    ...d,
    weight: d.weight != null ? parseFloat(d.weight.toFixed(1)) : null,
  }))

  const allWeights = formattedData.filter((d) => d.weight != null).map((d) => d.weight)
  const minWeight = Math.min(...allWeights, targetWeight || Infinity) - 1
  const maxWeight = Math.max(...allWeights, initialWeight || -Infinity) + 1

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={formattedData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: '#a1a1aa' }}
          tickLine={false}
          axisLine={{ stroke: '#f4f4f5' }}
          tickFormatter={(v) => {
            const d = new Date(v)
            return `${d.getMonth() + 1}/${d.getDate()}`
          }}
        />
        <YAxis
          domain={[minWeight, maxWeight]}
          tick={{ fontSize: 11, fill: '#a1a1aa' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v}`}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 12,
            border: '1px solid #e4e4e7',
            boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
            fontSize: 13,
          }}
          labelFormatter={(v) => `日期: ${v}`}
          formatter={(value) => [`${value} kg`, '体重']}
        />
        {targetWeight != null && (
          <ReferenceLine
            y={targetWeight}
            stroke="#a1a1aa"
            strokeDasharray="6 4"
            strokeWidth={1}
            label={{
              value: `目标 ${targetWeight}`,
              position: 'right',
              fontSize: 11,
              fill: '#a1a1aa',
            }}
          />
        )}
        <Line
          type="monotone"
          dataKey="weight"
          stroke="#638591"
          strokeWidth={2}
          dot={{ r: 2.5, fill: '#638591', strokeWidth: 0 }}
          activeDot={{ r: 4, fill: '#638591', strokeWidth: 2, stroke: '#fff' }}
          connectNulls={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
