'use client'
import { useState, useEffect, useRef, useMemo } from 'react';

type PokemonType = {
  slot: number;
  type: {
    name: string;
    url: string;
  };
};

type Pokemon = {
  name: string;
  url: string;
  types: PokemonType[];
};

type PokemonData = {
  results: Pokemon[];
};

const typeColors: { [key: string]: string } = {
  normal: 'bg-gray-400',
  fighting: 'bg-red-600',
  flying: 'bg-blue-400',
  poison: 'bg-purple-600',
  ground: 'bg-yellow-700',
  rock: 'bg-gray-700',
  bug: 'bg-green-500',
  ghost: 'bg-indigo-500',
  steel: 'bg-gray-600',
  fire: 'bg-red-500',
  water: 'bg-blue-500',
  grass: 'bg-green-400',
  electric: 'bg-yellow-400',
  psychic: 'bg-purple-400',
  ice: 'bg-blue-200',
  dragon: 'bg-red-800',
  dark: 'bg-gray-800',
  fairy: 'bg-pink-400',
};

const SkeletonLoading = () => (
  <div className="w-full flex gap-1 justify-center flex-row flex-wrap">
    {[...Array(10)].map((_, index) => (
      <div key={index} className="skeleton-loading placeholder w-32 h-32">
      </div>
    ))}
  </div>
);

export default function Home() {
  // Inside the Home component

  const [pokemonData, setPokemonData] = useState<PokemonData | null>(null);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const limit = 20;
  const observer = useRef<IntersectionObserver | null>(null);
  const lastPokemonRef = useRef<HTMLDivElement | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc'); // Track sort order
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterType(event.target.value);
  };

  const handleSortChange = () => {
    setSortOrder((prevSortOrder) => (prevSortOrder === 'asc' ? 'desc' : 'asc'));
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  useEffect(() => {
    setLoading(true);
    fetch(`https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`)
      .then((response) => response.json())
      .then((data: PokemonData) => {
        const promises = data.results.map((pokemon) =>
          fetch(pokemon.url).then((response) => response.json())
        );
        Promise.all(promises).then((pokemonDetails) => {
          const newPokemonData = {
            results: [...(pokemonData?.results || []), ...pokemonDetails.map((detail, index) => ({
              ...data.results[index],
              types: detail.types,
            }))]
          };
          setPokemonData(newPokemonData);
          setLoading(false);
        });
      });
  }, [offset]);

  useEffect(() => {
    if (!pokemonData || !lastPokemonRef.current || loading) return;

    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setLoading(true);
        setOffset((prevOffset) => prevOffset + limit);
      }
    });

    observer.current.observe(lastPokemonRef.current);

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [pokemonData, loading]);

  const sortedPokemonData = useMemo(() => {
    if (!pokemonData) return [];
    return pokemonData.results.slice().sort((a, b) => {
      const nameA = a.name.toUpperCase();
      const nameB = b.name.toUpperCase();
      if (sortOrder === 'asc') {
        return nameA.localeCompare(nameB);
      } else {
        return nameB.localeCompare(nameA);
      }
    });
  }, [pokemonData, sortOrder]);

  return (
    <main className='bg-purple-500 py-16'>
      <div className='flex gap-3 items-center justify-end w-full px-16 mb-5'>
        <button className='rounded-lg px-4 py-2 text-sm bg-gray-50 border-gray-300 text-gray-900 hover:bg-slate-100' onClick={handleSortChange}>
          Name {sortOrder === 'asc' ? 'A/Z' : 'Z/A'}
        </button>
        <select id="countries" className='max-w-24 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5' onChange={handleFilterChange} value={filterType || 'Semua Type'}>
          <option disabled>Filter Type Pokemon</option>
          {Object.keys(typeColors).map((type) => (
            <option key={type}>{type}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Search Pokemon"
          className='max-w-44 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5'
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>
      {pokemonData && (
        <div className='w-full flex gap-1 justify-center flex-row flex-wrap'>
          {sortedPokemonData
            .filter((pokemon) =>
              (!filterType || pokemon.types.some((type) => type.type.name === filterType)) &&
              (pokemon.name.toLowerCase().includes(searchQuery.toLowerCase()))
            )
            .map((pokemon, index) => (
              <div key={index} ref={index === sortedPokemonData.length - 1 ? lastPokemonRef : null} className=''>
                <div className="bg-white flex flex-col justify-end px-4">
                  <div className='flex justify-center'>
                    <img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.url.split('/')[6]}.png`} className="object-cover object-center" alt="" />
                  </div>
                  <h1 className='py-3 text-xs'>{index + 1}. {pokemon.name}</h1>
                </div>
                <div className='flex gap-0.5 items-center w-full'>
                  {pokemon.types.map((type, index) => (
                    <div key={index} className={`w-1/2 rounded-full py-0.5 ${typeColors[type.type.name]}`}>
                      <p className='text-white text-xs text-center'>{type.type.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
      {loading && <SkeletonLoading />}
    </main>
  );

}
