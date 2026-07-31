import type { FormEvent } from "react";
import type { SearchResult } from "../../types/viewModels";
import { normalizeVillageName } from "../../utils/featureFormatters";

interface SearchDockProps {
  searchInput: string;
  searchQuery: string;
  searchPanelOpen: boolean;
  searchResults: SearchResult[];
  selectedSearchResultId: string | null;
  onInputChange: (value: string) => void;
  onPanelOpenChange: (open: boolean) => void;
  onSelectedSearchResultChange: (id: string | null) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onResultClick: (result: SearchResult) => void;
}

export function SearchDock({
  searchInput,
  searchQuery,
  searchPanelOpen,
  searchResults,
  selectedSearchResultId,
  onInputChange,
  onPanelOpenChange,
  onSelectedSearchResultChange,
  onSubmit,
  onResultClick,
}: SearchDockProps) {
  const showSearchResults = searchPanelOpen && Boolean(searchQuery);

  return (
    <div
      className="searchDock"
      onBlur={(event) => {
        const nextFocused = event.relatedTarget;
        if (
          nextFocused instanceof Node &&
          event.currentTarget.contains(nextFocused)
        ) {
          return;
        }

        onPanelOpenChange(false);
      }}
    >
      <form className="searchTool searchToolCompact" onSubmit={onSubmit}>
        <label className="searchInputWrap">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            value={searchInput}
            placeholder="输入村庄或隐患点名称"
            onFocus={() => {
              if (searchQuery) {
                onPanelOpenChange(true);
              }
            }}
            onChange={(event) => {
              const nextValue = event.target.value;
              const nextQuery = normalizeVillageName(nextValue);
              onInputChange(nextValue);

              if (!nextQuery) {
                onSelectedSearchResultChange(null);
                onPanelOpenChange(false);
                return;
              }

              onSelectedSearchResultChange(null);
              onPanelOpenChange(true);
            }}
          />
        </label>
        <button type="submit" className="searchButton">
          检索
        </button>
      </form>

      {showSearchResults ? (
        searchResults.length > 0 ? (
          <div className="searchResults searchResultsFloating">
            {searchResults.map((result) => (
              <button
                type="button"
                key={result.id}
                className={`searchResult ${
                  selectedSearchResultId === result.id ? "isActive" : ""
                }`}
                onClick={() => {
                  onResultClick(result);
                }}
              >
                <span className={`searchResultType searchResultType-${result.type}`}>
                  {result.type === "hazard" ? "隐患点" : "村庄"}
                </span>
                <span className="searchResultText">
                  <strong>{result.label}</strong>
                  <small>{result.meta}</small>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="searchEmpty searchEmptyFloating">
            未找到匹配的村庄或隐患点
          </p>
        )
      ) : null}
    </div>
  );
}
