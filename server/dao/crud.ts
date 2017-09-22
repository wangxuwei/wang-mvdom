

/** 
 * A filter describe a set of considition that needs to be met where the
 * name is the "propName[;operation]" and the value is the value to be compared. 
 * All name:value in a Filter need to be met. For example
 *  - `{"projectId": 123} will select entities with projectId == 123 (default operation is =)
 *  - `{"stage;>": 1}` will select entity with stage > 1
 *  - `{"stage;>": 1, "projectId": 123}: will select entities from projectId 123 AND stage > 1
 *  - `[{"projectId", 123}, {""}]
 **/
export type Filter = { [name: string]: string | number | null };
/**
 * Filters is an array of Filter and represent a list of OR between each filter. 
 * Meaning, a entity will be match if any of the filter are met.
 */
export type Filters = Filter[];

/** Criteria used to select and order an entity query. Used dso.first and dso.list */
export interface Criteria {
	/** The offset where  */
	offset: number,
	/** The limit of element to be returned */
	limit: number,

	/** See type Filter and Filters */
	filter: Filter | Filters,
	
	/** 
	 * NOT IMPLEMENTED YET: a comma delimited of properties to be sorted by. For example: 
	 * - "title": order by .title asc
	 * - "!title": order by .title desc
	 * - "projectId, !id": order by projectId asc and id desc
	 */
	orderBy: string
}

export interface Crud<E> {
	
	create(entity: E): Promise<E>;

	update(id: number, entity: E): Promise<E>;

	get(id: number): Promise<E>;

	list(criteria: Criteria): Promise<E[]>;

	first(criteria: Criteria): Promise<E | null>;

	remove(id: number): Promise<boolean>;
}