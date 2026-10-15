import React from "react";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import { translate } from "@docusaurus/Translate";
import IconHome from "@theme/Icon/Home";

export default function HomeBreadcrumbItem() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <li className="breadcrumbs__item">
      <a
        className="breadcrumbs__link"
        href={String(siteConfig.customFields?.homeUrl)}
        aria-label={translate({
          id: "theme.docs.breadcrumbs.home",
          message: "Home page",
        })}
      >
        <IconHome
          style={{ width: "1rem", height: "1rem", verticalAlign: "middle" }}
        />
      </a>
    </li>
  );
}
