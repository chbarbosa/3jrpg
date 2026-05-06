import HeroPrepSlot from './HeroPrepSlot';

export default function PrepActionPanel({ heroes, heroActions, onPrepAction }) {
  return (
    <div className="panel">
      <div className="panel-title">
        Preparation
      </div>

      <div className="prep-slots-list">
        {heroes.map((hero) => (
          <HeroPrepSlot
            key={hero.id}
            hero={hero}
            isDone={heroActions[hero.id] ?? false}
            onPrepAction={onPrepAction}
            allHeroes={heroes}
          />
        ))}
      </div>
    </div>
  );
}
