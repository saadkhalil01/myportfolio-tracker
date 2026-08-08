import { useState } from 'react';
import { fmt } from '../storage.js';
import { isSavingsInvestment } from '../investmentClassification.js';

const clamp = (value) => Math.min(100, Math.max(0, value));

function healthLabel(score) {
  if (score >= 80) return { label: 'Excellent', tone: 'excellent' };
  if (score >= 65) return { label: 'Good', tone: 'good' };
  if (score >= 50) return { label: 'Fair', tone: 'fair' };
  return { label: 'Needs attention', tone: 'attention' };
}

export default function PortfolioHealth({ categories, totals, liabilitiesTotal }) {
  const [showHelp, setShowHelp] = useState(false);
  const [showSavingsInfo, setShowSavingsInfo] = useState(false);
  const assets = Number(totals.currentValue || 0);
  const invested = Number(totals.invested || 0);
  const liabilities = Number(liabilitiesTotal || 0);
  const savingsInvestments = categories.filter(isSavingsInvestment);
  const savings = savingsInvestments.reduce(
    (sum, category) => sum + Number(category.currentValue || 0),
    0
  );
  const fundedCategories = categories.filter((category) => Number(category.currentValue || 0) > 0).length;

  const debtCoverage =
    assets <= 0 ? 0 : liabilities <= 0 ? 100 : clamp((assets / liabilities / 3) * 100);
  const savingsBuffer =
    assets <= 0
      ? 0
      : liabilities > 0
        ? clamp((savings / liabilities) * 100)
        : clamp((savings / assets / 0.2) * 100);
  const returnPct = invested > 0 ? ((assets - invested) / invested) * 100 : 0;
  const performance = invested > 0 ? clamp(50 + returnPct * 2.5) : 0;
  const diversification = clamp((fundedCategories / 4) * 100);

  const factors = [
    {
      name: 'Debt coverage',
      weight: 35,
      score: debtCoverage,
      detail: liabilities > 0 ? `${(assets / liabilities).toFixed(1)}× assets to liabilities` : 'No liabilities',
    },
    {
      name: 'Savings buffer',
      weight: 25,
      score: savingsBuffer,
      detail: `${fmt(savings)} in savings and emergency funds`,
    },
    {
      name: 'Investment performance',
      weight: 25,
      score: performance,
      detail: `${returnPct >= 0 ? '+' : ''}${returnPct.toFixed(1)}% portfolio return`,
    },
    {
      name: 'Diversification',
      weight: 15,
      score: diversification,
      detail: `${fundedCategories} funded categor${fundedCategories === 1 ? 'y' : 'ies'}`,
    },
  ];

  const score = Math.round(
    factors.reduce((total, factor) => total + factor.score * (factor.weight / 100), 0)
  );
  const status = healthLabel(score);
  const savingsTarget = liabilities > 0 ? liabilities : assets * 0.2;
  const savingsGap = Math.max(0, savingsTarget - savings);
  const debtReductionTarget = Math.max(0, liabilities - assets / 3);
  const improvementIdeas = [
    {
      score: debtCoverage,
      title: 'Strengthen debt safety',
      text:
        liabilities <= 0
          ? 'You have no recorded liabilities, so this part of your health score is already strong.'
          : debtReductionTarget > 0
            ? `Aim to reduce liabilities by about ${fmt(debtReductionTarget)}, or grow assets until they are at least 3× your liabilities.`
            : 'Your assets already provide strong coverage for your recorded liabilities.',
    },
    {
      score: savingsBuffer,
      title: 'Build your savings buffer',
      text:
        savingsGap > 0
          ? `Add about ${fmt(savingsGap)} more to investments marked Savings to reach the current buffer target of ${fmt(savingsTarget)}.`
          : `Your marked savings of ${fmt(savings)} meet the current buffer target. Keep those funds accessible.`,
    },
    {
      score: performance,
      title: 'Review investment performance',
      text:
        invested <= 0
          ? 'Add invested amounts so performance can be measured accurately.'
          : returnPct < 0
            ? `Your portfolio return is ${returnPct.toFixed(1)}%. Review losing holdings, fees, and whether each investment still fits your plan.`
            : `Your portfolio return is +${returnPct.toFixed(1)}%. Continue reviewing risk and costs instead of relying only on recent gains.`,
    },
    {
      score: diversification,
      title: 'Improve diversification',
      text:
        fundedCategories < 4
          ? `You have ${fundedCategories} funded categor${fundedCategories === 1 ? 'y' : 'ies'}. Consider ${4 - fundedCategories} more suitable categor${4 - fundedCategories === 1 ? 'y' : 'ies'} to reach the four-category target.`
          : `You have ${fundedCategories} funded categories, meeting the diversification target. Check that no single category dominates the portfolio.`,
    },
  ]
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  return (
    <div className="portfolio-health-block">
      <div className="health-section-toolbar">
        <button
          type="button"
          className="health-help-button"
          aria-expanded={showHelp}
          onClick={() => setShowHelp((visible) => !visible)}
        >
          <span aria-hidden="true">?</span>
          Help me improve
        </button>
      </div>
      <section className={`card portfolio-health health-${status.tone}`}>
      <div className="health-summary">
        <div
          className="health-gauge"
          style={{ '--health-score': score }}
          role="img"
          aria-label={`Portfolio health score ${score} out of 100`}
        >
          <div className="health-gauge-center">
            <strong>{score}</strong>
            <span>/ 100</span>
          </div>
        </div>
        <div className="health-heading">
          <span className="stat-label">Overall Portfolio Health</span>
          <h2>{status.label}</h2>
          <p>Balances investments, accessible savings, performance, and liabilities.</p>
        </div>
      </div>

      <div className="health-factors">
        {factors.map((factor) => (
          <div
            className={`health-factor${factor.score >= 99.5 ? ' health-factor-complete' : ''}`}
            key={factor.name}
          >
            <div className="health-factor-head">
              <span>
                {factor.score >= 99.5 ? <i aria-hidden="true">✓</i> : null}
                {factor.name}
                {factor.name === 'Savings buffer' ? (
                  <button
                    type="button"
                    className="savings-info-button"
                    aria-label="Show investments included in savings buffer"
                    title="What is included in savings?"
                    onClick={() => setShowSavingsInfo(true)}
                  >
                    !
                  </button>
                ) : null}
              </span>
              <strong>
                {factor.score >= 99.5 ? 'Complete' : `${Math.round(factor.score)}/100`}
              </strong>
            </div>
            <div className="health-factor-track">
              <span style={{ width: `${factor.score}%` }} />
            </div>
            <small>{factor.weight}% weight · {factor.detail}</small>
          </div>
        ))}
      </div>

      {showHelp ? (
        <div className="health-help-panel">
          <div className="health-help-heading">
            <strong>Your best next steps</strong>
            <span>Based on your current portfolio health data</span>
          </div>
          <div className="health-help-ideas">
            {improvementIdeas.map((idea, index) => (
              <div className="health-help-idea" key={idea.title}>
                <span>{index + 1}</span>
                <div>
                  <strong>{idea.title}</strong>
                  <p>{idea.text}</p>
                </div>
              </div>
            ))}
          </div>
          <small>These suggestions are planning guidance, not financial advice.</small>
        </div>
      ) : null}

      {showSavingsInfo ? (
        <div className="modal-backdrop" role="presentation">
          <div
            className="modal savings-info-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="savings-info-title"
          >
            <div className="investment-options-head">
              <div>
                <span className="stat-label">Portfolio Health</span>
                <h2 id="savings-info-title">What counts as savings?</h2>
              </div>
              <button
                type="button"
                className="btn-icon modal-close-btn"
                aria-label="Close savings information"
                onClick={() => setShowSavingsInfo(false)}
              >
                ✕
              </button>
            </div>

            <div className="savings-modal-total">
              <span>Current savings buffer</span>
              <strong>{fmt(savings)}</strong>
            </div>

            {savingsInvestments.length ? (
              <div className="savings-modal-list">
                {savingsInvestments.map((investment) => (
                  <div key={investment.id}>
                    <span>{investment.name}</span>
                    <strong>{fmt(investment.currentValue)}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <p className="savings-modal-empty">No investments are currently marked as savings.</p>
            )}

            <div className="savings-modal-explanation">
              <strong>Included automatically</strong>
              <p>Savings Account, Emergency Funds, and Mutual Fund (Low Risk).</p>
              <strong>How to change it</strong>
              <p>Open Investments, press the vertical dots beside an investment, and turn “Count as savings” on or off.</p>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn" onClick={() => setShowSavingsInfo(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <details className="health-formula">
        <summary>How is my health score calculated?</summary>
        <p>
          Your score is out of 100. It combines four simple checks. The percentages show how much
          each check affects the final score.
        </p>
        <ul>
          <li><strong>Debt safety — 35%:</strong> More assets and less debt improve this score. You get full points with no debt or assets worth at least three times your liabilities.</li>
          <li><strong>Savings cushion — 25%:</strong> Savings should cover your liabilities. If you have no debt, the target is savings equal to 20% of your assets.</li>
          <li><strong>Investment growth — 25%:</strong> This compares what you invested with what your portfolio is worth now. A positive return raises the score.</li>
          <li><strong>Investment mix — 15%:</strong> Four or more funded categories receive full diversification points.</li>
          <li><strong>What counts as savings:</strong> Savings Account, Emergency Funds, and Low-Risk Mutual Fund count automatically. You can change this from any investment row.</li>
        </ul>
      </details>
      </section>
    </div>
  );
}
