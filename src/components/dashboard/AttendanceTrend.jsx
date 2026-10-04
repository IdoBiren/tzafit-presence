import { TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { getDormColor } from '../../utils/dormColors';

// אחוז נוכחות יומי לכל קבוצה + קו מקווקו לכל הפנימייה.
// ציר הזמן כולל רק ימים שבהם התבצע רישום, כדי שימים סגורים לא ייראו כ"0%".
const AttendanceTrend = ({ trend, groupNames }) => (
  <div className="card">
    <h3 className="dash-section-title">
      <TrendingUp size={18} />
      <span>מגמת נוכחות יומית</span>
    </h3>
    <p className="dash-muted">אחוז נוכחות = נוכחים מתוך (נוכחים + חסרים) בכל סבבי היום. מי שבבית או לא סומן אינו נספר.</p>

    {trend.length < 2 ? (
      <p className="dash-muted" style={{ padding: '2rem 0', textAlign: 'center' }}>
        צריך לפחות שני ימי רישום בתקופה כדי להציג מגמה.
      </p>
    ) : (
      <div style={{ width: '100%', height: 280, direction: 'ltr' }}>
        <ResponsiveContainer>
          <LineChart data={trend} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
            <CartesianGrid stroke="var(--border-color)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
            {/* הציר מתחיל קצת מתחת לערך הנמוך ביותר: ב-0-100% כל הקווים נדחסים
                לפס צר למעלה וההבדלים בין הקבוצות לא נראים */}
            <YAxis
              domain={[min => Math.max(0, Math.floor((min - 5) / 10) * 10), 100]}
              allowDataOverflow
              tick={{ fontSize: 11 }}
              tickFormatter={v => `${v}%`}
            />
            <Tooltip formatter={(value, name) => [value === null ? '—' : `${value}%`, name]} />
            <Legend wrapperStyle={{ fontSize: 12, direction: 'rtl' }} />
            {(groupNames || []).map(g => (
              <Line
                key={g}
                type="monotone"
                dataKey={g}
                name={g}
                stroke={getDormColor(g, groupNames)}
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls
              />
            ))}
            <Line
              type="monotone"
              dataKey="overall"
              name="כל הפנימייה"
              stroke="#0f172a"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    )}
  </div>
);

export default AttendanceTrend;
