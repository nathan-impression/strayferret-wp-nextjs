//@ts-nocheck
import database from '../../src/database';

export async function getServerSideProps() {
	const db = new database();

	const results = await db.query(
		// "select * from wpimp_posts where post_status = 'publish' AND post_type = 'post' order by post_date desc;"
		// "SELECT wpp.ID, wpp.post_name, wpp.post_date, wpp.post_title, wpp.post_excerpt, wpp.guid, REPLACE( REPLACE( REPLACE( REPLACE( wpo.option_value, '%year%', DATE_FORMAT(wpp.post_date,'%Y') ), '%monthnum%', DATE_FORMAT(wpp.post_date, '%m') ), '%day%', DATE_FORMAT(wpp.post_date, '%d') ), '%postname%', wpp.post_name ) AS permalink FROM wpimp_posts wpp JOIN wpimp_options wpo ON wpo.option_name = 'permalink_structure' WHERE wpp.post_type = 'post' AND wpp.post_status = 'publish' ORDER BY wpp.post_date DESC;"
		"SELECT wpimp_posts.id, wpimp_posts.post_title, wpimp_terms.name, wpimp_posts.post_name, wpimp_posts.post_date, wpimp_posts.post_title, wpimp_posts.post_excerpt, wpimp_posts.guid, wpimp_terms.name AS category, (SELECT guid FROM wpimp_posts WHERE id = wpimp_postmeta.meta_value) AS image FROM wpimp_posts, wpimp_postmeta, wpimp_term_relationships, wpimp_terms WHERE wpimp_posts.id = wpimp_term_relationships.object_id AND wpimp_terms.term_id = wpimp_term_relationships.term_taxonomy_id AND wpimp_posts.post_status = 'publish' AND wpimp_posts.post_type = 'post' AND wpimp_postmeta.post_id = wpimp_posts.id AND wpimp_postmeta.meta_key = '_thumbnail_id' ORDER BY wpimp_posts.post_date DESC;"
	);
	// console.log(results);

	return {
		props: {
			news: results.map((row) => {
				return {
					ID: row.id,
					slug: row.post_name,
					date: JSON.stringify(
						row.post_date.toLocaleDateString('en-GB')
					),
					title: row.post_title,
					excerpt: row.post_excerpt,
					image: row.image,
					category: row.category,
				};
			}),
		},
	};
}

export default function Page({
	ID,
	slug,
	date,
	excerpt,
	image,
	category,
	news,
	results,
}) {
	return (
		<>
			<section class="posts">
				{news.map(
					({ ID, slug, date, title, excerpt, image, category }) => (
						<div
							key={ID}
							className={`posts-item post-${ID}`}
						>
							<a href={'/news/' + slug}>
								<h2>{title}</h2>
								<p>{excerpt}</p>
								<p>
									<strong>{category}</strong>
								</p>
								<p>
									<date>{date}</date>
								</p>
								<img
									src={image}
									alt=""
								/>
							</a>
						</div>
					)
				)}
			</section>
		</>
	);
}
